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
     * Cross-domain token handler.
     * Checks if the URL hash contains valid Supabase auth tokens
     * (from cross-domain redirects like hollowbits.com → play.hollowbits.com).
     * We manually parse and consume them because detectSessionInUrl is OFF
     * to avoid the race condition that causes infinite login loops.
     */
    const hash = window.location.hash;
    const hashHasTokens =
      hash.length > 50 &&
      hash.includes('access_token=') &&
      hash.includes('refresh_token=');

    if (hashHasTokens) {
      try {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token') || '';
        const refreshToken = params.get('refresh_token') || '';

        // Only proceed if tokens look like real JWT/tokens (not empty strings)
        if (accessToken.length > 30 && accessToken.includes('.') && refreshToken.length > 10) {
          // Clean the hash from URL immediately
          window.history.replaceState(null, '', window.location.pathname + window.location.search);

          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }).then(({ data, error }) => {
            if (data.session && !error) {
              commitSession(data.session);
            } else {
              // setSession failed — fall through to normal getSession
              supabase.auth.getSession().then(({ data: { session } }) => commitSession(session));
            }
          }).catch(() => {
            supabase.auth.getSession().then(({ data: { session } }) => commitSession(session));
          });

          // Early return — we're handling this path asynchronously above
        } else {
          // Tokens present but invalid — ignore hash, proceed normally
          supabase.auth.getSession().then(({ data: { session } }) => commitSession(session))
            .catch(() => commitSession(null));
        }
      } catch {
        // Hash parsing failed — proceed normally
        supabase.auth.getSession().then(({ data: { session } }) => commitSession(session))
          .catch(() => commitSession(null));
      }
    } else {
      // No hash tokens — standard session hydration from localStorage
      supabase.auth.getSession().then(({ data: { session } }) => commitSession(session))
        .catch(() => commitSession(null));
    }

    // Subscribe to auth state changes (login, logout, token refresh)
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
