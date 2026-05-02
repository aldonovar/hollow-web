import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

const isOnHollowbits = typeof window !== 'undefined' &&
  window.location.hostname.includes('hollowbits.com');

/**
 * Cross-domain SSO Storage Strategy:
 * - PRIMARY:   localStorage (always reliable, no parsing issues)
 * - SECONDARY: .hollowbits.com domain cookie (for cross-subdomain sync)
 *
 * On hollowbits.com → play.hollowbits.com, the browser shares cookies
 * at the root domain level, so both subdomains see the session.
 */
const ssoStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;

    // 1. Always prefer localStorage as primary source
    const localVal = window.localStorage.getItem(key);
    if (localVal) return localVal;

    // 2. Fallback: try reading from the shared domain cookie
    if (typeof document !== 'undefined') {
      // Escape special chars in the key for the regex
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = document.cookie.match(
        new RegExp('(?:^|; )' + escapedKey + '=([^;]*)')
      );
      if (match) {
        const val = decodeURIComponent(match[1]);
        // Promote back to localStorage so future reads are instant
        try { window.localStorage.setItem(key, val); } catch { /* ignore */ }
        return val;
      }
    }

    return null;
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;

    // Always write to localStorage first
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }

    // Also write to the shared domain cookie for cross-subdomain SSO
    if (typeof document !== 'undefined' && isOnHollowbits) {
      try {
        const encoded = encodeURIComponent(value);
        // Cap cookie size: Supabase tokens can be large, only store if < 4KB
        if (encoded.length < 4000) {
          document.cookie = `${key}=${encoded}; domain=.hollowbits.com; path=/; max-age=31536000; SameSite=Lax; Secure`;
        }
      } catch { /* ignore */ }
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;

    try { window.localStorage.removeItem(key); } catch { /* ignore */ }

    if (typeof document !== 'undefined') {
      // Delete from both with and without domain to cover all cases
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      if (isOnHollowbits) {
        document.cookie = `${key}=; domain=.hollowbits.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ssoStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Re-enabled: needed for OAuth (Google) and Magic Link callbacks
    // to properly exchange the code/hash for a session token.
    detectSessionInUrl: true,
  },
});
