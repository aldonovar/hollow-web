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
    let resolved = false;

    const resolveLoading = () => {
      if (!resolved) {
        resolved = true;
        const state = get();
        if (state.isLoading) {
          set({ isLoading: false });
        }
      }
    };

    // SAFETY NET: Always resolve loading within 5 seconds no matter what.
    // This prevents the "Cargando sesión..." infinite loop.
    const safetyTimeout = setTimeout(() => {
      console.warn('[authStore] Safety timeout — forcing isLoading=false');
      resolveLoading();
    }, 5000);

    // 1. Hydrate from existing session (page refresh)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const needsMfa = await safeMfaCheck();
        const profile = await fetchProfile(session.user.id);
        set({ user: session.user, session, profile, requiresMfa: needsMfa, isLoading: false });
      } else {
        set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
      }
      resolved = true;
      clearTimeout(safetyTimeout);
    }).catch((err) => {
      console.error('[authStore] Failed to get session:', err);
      set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
      resolved = true;
      clearTimeout(safetyTimeout);
    });

    // 2. Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Skip token refresh events to avoid flicker
        if (event === 'TOKEN_REFRESHED') return;

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
