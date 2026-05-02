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
    return data;
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

    /**
     * Cross-domain token handler:
     * When navigating from hollowbits.com → play.hollowbits.com, tokens are
     * passed in the URL hash as #access_token=...&refresh_token=...
     * We consume them here and call setSession() before the standard hydration.
     */
    const hash = window.location.hash;
    const hashHasTokens = hash.includes('access_token=') && hash.includes('refresh_token=');

    const hydrateSession = async () => {
      if (hashHasTokens) {
        try {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token') || '';
          const refreshToken = params.get('refresh_token') || '';
          // Clean the hash from URL immediately
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          if (accessToken.length > 30 && refreshToken.length > 10) {
            const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (data.session && !error) return data.session;
          }
        } catch (err) {
          console.warn('[authStore] Hash token exchange failed:', err);
        }
      }
      // Standard hydration from ssoStorage (localStorage primary)
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    };

    hydrateSession()
      .then(async (session) => {
        clearTimeout(safetyTimeout);
        if (session?.user) {
          const [needsMfa, profile] = await Promise.all([safeMfaCheck(), fetchProfile(session.user.id)]);
          set({ user: session.user, session, profile, requiresMfa: needsMfa, isLoading: false });
        } else {
          set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
        }
      })
      .catch(() => {
        clearTimeout(safetyTimeout);
        set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
      });

    /**
     * Subscribe to auth events for SUBSEQUENT changes (login, logout, etc.)
     * IMPORTANT: We do NOT set isLoading:true here to avoid blocking the UI
     * during background updates. We update the state directly once resolved.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Skip token refresh — handled transparently by Supabase
        if (event === 'TOKEN_REFRESHED') return;

        // Skip INITIAL_SESSION — already handled by getSession() above
        if (event === 'INITIAL_SESSION') return;

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
