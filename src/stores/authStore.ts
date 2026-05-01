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

/**
 * Parse cross-domain auth tokens from the URL hash.
 * Returns the tokens only if BOTH access_token AND refresh_token are present
 * and are non-empty JWT-like strings (contain dots).
 * Returns null for all other cases to avoid false positives.
 */
function extractCrossDomainTokens(): { accessToken: string; refreshToken: string } | null {
  try {
    const hash = window.location.hash;
    // Quick bail — must start with # and contain both token keys
    if (!hash || hash.length < 20) return null;
    if (!hash.includes('access_token=') || !hash.includes('refresh_token=')) return null;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    // Validate tokens look like real JWTs (contain dots for header.payload.signature)
    if (!accessToken || !refreshToken) return null;
    if (!accessToken.includes('.') || accessToken.length < 30) return null;
    if (refreshToken.length < 10) return null;

    return { accessToken, refreshToken };
  } catch {
    return null;
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

    // Helper to sync session into store
    const syncSession = async (session: Session | null) => {
      if (session?.user) {
        const needsMfa = await safeMfaCheck();
        const profile = await fetchProfile(session.user.id);
        set({ user: session.user, session, profile, requiresMfa: needsMfa, isLoading: false });
      } else {
        set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
      }
      clearTimeout(safetyTimeout);
    };

    // Step 1: Check for cross-domain auth tokens in URL hash
    const crossDomainTokens = extractCrossDomainTokens();

    if (crossDomainTokens) {
      // Clean the hash from URL immediately
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      // Consume tokens via setSession — this is the ONLY reliable way
      // to establish a session from cross-domain token transfer
      supabase.auth.setSession({
        access_token: crossDomainTokens.accessToken,
        refresh_token: crossDomainTokens.refreshToken,
      }).then(({ data, error }) => {
        if (data.session && !error) {
          syncSession(data.session);
        } else {
          console.warn('[authStore] Cross-domain setSession failed:', error?.message);
          // Fall back to normal session check
          supabase.auth.getSession().then(({ data: { session } }) => syncSession(session));
        }
      }).catch(() => {
        supabase.auth.getSession().then(({ data: { session } }) => syncSession(session));
      });
    } else {
      // Step 2: Normal hydration — read existing session from storage
      supabase.auth.getSession().then(({ data: { session } }) => {
        syncSession(session);
      }).catch((err) => {
        console.error('[authStore] Failed to get session:', err);
        set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
        clearTimeout(safetyTimeout);
      });
    }

    // Step 3: Subscribe to auth state changes (login, logout, token refresh)
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
