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

    // SAFETY NET: Always resolve loading within 8 seconds no matter what.
    const safetyTimeout = setTimeout(() => {
      console.warn('[authStore] Safety timeout — forcing isLoading=false');
      resolveLoading();
    }, 8000);

    /**
     * Cross-domain auth hash handler.
     * When redirecting from hollowbits.com → play.hollowbits.com, the session
     * tokens are passed via URL hash (#access_token=...&refresh_token=...).
     * Supabase's `detectSessionInUrl` processes these asynchronously in its
     * internal _initialize(), which races with our getSession() call.
     * If getSession() resolves before Supabase processes the hash, it returns
     * null → ProtectedRoute redirects to /login → hash is lost → infinite loop.
     *
     * Fix: Manually parse the hash and call setSession() FIRST, then proceed.
     */
    const hash = window.location.hash;
    const hasAuthHashTokens = hash.includes('access_token=') && hash.includes('refresh_token=');

    const hydrateSession = async (): Promise<void> => {
      try {
        // Step 1: If URL contains cross-domain auth tokens, consume them explicitly
        if (hasAuthHashTokens) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            console.info('[authStore] Cross-domain auth tokens detected — calling setSession()');

            // Clean the hash from URL immediately to prevent re-processing
            window.history.replaceState(null, '', window.location.pathname + window.location.search);

            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (data.session?.user && !error) {
              const needsMfa = await safeMfaCheck();
              const profile = await fetchProfile(data.session.user.id);
              set({
                user: data.session.user,
                session: data.session,
                profile,
                requiresMfa: needsMfa,
                isLoading: false,
              });
              resolved = true;
              clearTimeout(safetyTimeout);
              return; // Session established — done
            }

            // setSession failed — fall through to normal getSession()
            console.warn('[authStore] setSession from hash failed:', error?.message);
          }
        }

        // Step 2: Normal hydration — read existing session from storage
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const needsMfa = await safeMfaCheck();
          const profile = await fetchProfile(session.user.id);
          set({ user: session.user, session, profile, requiresMfa: needsMfa, isLoading: false });
        } else {
          set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
        }
      } catch (err) {
        console.error('[authStore] Failed to hydrate session:', err);
        set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
      } finally {
        resolved = true;
        clearTimeout(safetyTimeout);
      }
    };

    hydrateSession();

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
