import { create } from 'zustand';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { Profile } from '../types/supabase';
import { supabase } from '../lib/supabase';
import { resolveTier } from '@hollowbits/core';

/* ─── State Shape ────────────────────────────────────────────────── */

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  requiresMfa: boolean;
}

interface AuthActions {
  initialize: () => () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
      console.warn('[authStore] Profile fetch failed:', error.message);
      return null;
    }
    return {
      ...data,
      tier: data.tier === null ? null : resolveTier(data.tier),
    };
  } catch (err) {
    console.warn('[authStore] Profile fetch exception:', err);
    return null;
  }
}

async function safeMfaCheck(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return data?.currentLevel === 'aal1' && data?.nextLevel === 'aal2';
  } catch {
    return false;
  }
}

/* ─── Store ──────────────────────────────────────────────────────── */

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  requiresMfa: false,

  initialize: () => {
    // Safety net: max 5s for initial hydration
    const safetyTimeout = setTimeout(() => {
      if (get().isLoading) {
        console.warn('[authStore] Safety timeout — forcing isLoading=false');
        set({ isLoading: false });
      }
    }, 5000);

    const hydrateSession = async () => {
      // OAuth callbacks are exchanged explicitly by /auth/callback. Session
      // hydration only reads the current origin's Supabase-managed storage.
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    };

    hydrateSession()
      .then(async (session) => {
        if (session?.user) {
          const [needsMfa, profile] = await Promise.all([safeMfaCheck(), fetchProfile(session.user.id)]);
          set({ user: session.user, session, profile, requiresMfa: needsMfa, isLoading: false });
        } else {
          set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
        }
        clearTimeout(safetyTimeout);
      })
      .catch(() => {
        set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
        clearTimeout(safetyTimeout);
      });

    /**
     * Subscribe to auth events for SUBSEQUENT changes (login, logout, etc.)
     * IMPORTANT: We do NOT set isLoading:true here to avoid blocking the UI
     * during background updates. We update the state directly once resolved.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // Skip token refresh — handled transparently by Supabase
        if (event === 'TOKEN_REFRESHED') return;

        // Skip INITIAL_SESSION — already handled by getSession() above
        if (event === 'INITIAL_SESSION') return;

        // IMPORTANT: We do not await this function so we don't return a Promise to onAuthStateChange.
        // If we return a Promise, GoTrue awaits it while holding the auth mutex lock.
        // fetchProfile calls supabase.from() which calls getSession(), which tries to acquire the same lock,
        // causing an eternal deadlock (the "Procesando..." forever bug).
        const hydrate = async () => {
          try {
            if (session?.user) {
              const [needsMfa, profile] = await Promise.all([
                safeMfaCheck(),
                fetchProfile(session.user.id),
              ]);
              // Update session WITHOUT touching isLoading to avoid UI flash
              set({ user: session.user, session, profile, requiresMfa: needsMfa });
            } else {
              // SIGNED_OUT: clear everything
              set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
            }
          } catch (err) {
            console.error('[authStore] onAuthStateChange error:', err);
            // On error, don't clear session — keep whatever we had
          }
        };

        hydrate();
      }
    );

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[authStore] Sign-out error:', err);
    }
    set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (user) {
      const profile = await fetchProfile(user.id);
      set({ profile });
    }
  },

  checkMfa: async () => {
    const needsMfa = await safeMfaCheck();
    set({ requiresMfa: needsMfa });
  },
}));
