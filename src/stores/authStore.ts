import { create } from 'zustand';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { Profile } from '../types/supabase';
import { supabase } from '../lib/supabase';

/* ─── State Shape ────────────────────────────────────────────────── */

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  requiresMfa: boolean;
}

interface AuthActions {
  /** Bootstrap: call once in App root to hydrate session & subscribe to changes */
  initialize: () => () => void;
  /** Sign out and clear all state */
  signOut: () => Promise<void>;
  /** Re-fetch the profile from the database (after edits) */
  refreshProfile: () => Promise<void>;
  /** Re-check MFA status after successful verification */
  checkMfa: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

/* ─── Helpers ────────────────────────────────────────────────────── */

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[authStore] Profile fetch failed (non-blocking):', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[authStore] Profile fetch exception (non-blocking):', err);
    return null;
  }
}

/** Safely check MFA — returns false on any error instead of hanging */
async function safeMfaCheck(): Promise<boolean> {
  try {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2';
  } catch {
    return false;
  }
}

/* ─── Store ──────────────────────────────────────────────────────── */

export const useAuthStore = create<AuthStore>((set, get) => ({
  // --- initial state ---
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  requiresMfa: false,

  // --- actions ---
  initialize: () => {
    // SAFETY NET: Always resolve loading within 4 seconds no matter what.
    const safetyTimeout = setTimeout(() => {
      console.warn('[authStore] Safety timeout — forcing isLoading=false');
      if (get().isLoading) {
        set({ isLoading: false });
      }
    }, 4000);

    // Helper to sync a session into the store and clear the safety timeout
    const commitSession = async (session: Session | null) => {
      try {
        if (session?.user) {
          const needsMfa = await safeMfaCheck();
          const profile = await fetchProfile(session.user.id);
          set({ user: session.user, session, profile, requiresMfa: needsMfa, isLoading: false });
        } else {
          set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
        }
      } catch {
        set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
      }
      clearTimeout(safetyTimeout);
    };

    /**
     * Standard session hydration.
     * detectSessionInUrl:true en supabase.ts maneja automáticamente:
     * - OAuth callbacks (Google, etc.) con ?code=
     * - Magic Link callbacks con #access_token=
     * Solo necesitamos obtener la sesión activa del storage.
     */
    supabase.auth.getSession().then(({ data: { session } }) => commitSession(session))
      .catch(() => commitSession(null));

    // Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Skip token refresh events to avoid flicker
        if (event === 'TOKEN_REFRESHED') return;

        // Inmediatamente marcamos como cargando para bloquear ProtectedRoute
        // y evitar condiciones de carrera si Auth.tsx intenta navegar muy rápido.
        set({ isLoading: true });

        if (session?.user) {
          const needsMfa = await safeMfaCheck();
          const profile = await fetchProfile(session.user.id);
          set({ user: session.user, session, profile, requiresMfa: needsMfa, isLoading: false });
        } else {
          set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
        }
      }
    );

    // Return unsubscribe handle for cleanup
    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('[authStore] Sign-out error:', error.message);
    } catch (err) {
      console.error('[authStore] Sign-out exception:', err);
    }
    set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
  },

  refreshProfile: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      set({ profile });
    }
  },

  checkMfa: async () => {
    const needsMfa = await safeMfaCheck();
    set({ requiresMfa: needsMfa });
  },
}));
