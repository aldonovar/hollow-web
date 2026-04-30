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
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[authStore] Failed to fetch profile:', error.message);
    return null;
  }
  return data;
}

/* ─── Store ──────────────────────────────────────────────────────── */

export const useAuthStore = create<AuthStore>((set) => ({
  // --- initial state ---
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  requiresMfa: false,

  // --- actions ---
  initialize: () => {
    // 1. Hydrate from existing session (page refresh)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const needsMfa = aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2';
        
        const profile = await fetchProfile(session.user.id);
        set({ user: session.user, session, profile, requiresMfa: needsMfa, isLoading: false });
      } else {
        set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
      }
    }).catch((err) => {
      console.error('[authStore] Failed to get session:', err);
      set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
    });

    // 2. Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Skip token refresh events to avoid flicker, EXCEPT if we need to check MFA
        if (event === 'TOKEN_REFRESHED') return;

        if (session?.user) {
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          const needsMfa = aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2';
          
          const profile = await fetchProfile(session.user.id);
          set({ user: session.user, session, profile, requiresMfa: needsMfa, isLoading: false });
        } else {
          set({ user: null, session: null, profile: null, requiresMfa: false, isLoading: false });
        }
      }
    );

    // Return unsubscribe handle for cleanup
    return () => subscription.unsubscribe();
  },

  signOut: async () => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[authStore] Sign-out error:', error.message);
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
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const needsMfa = aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2';
    set({ requiresMfa: needsMfa });
  },
}));
