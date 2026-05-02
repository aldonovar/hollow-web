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

// Cookie helpers for cross-subdomain SSO (.hollowbits.com)
const COOKIE_DOMAIN = 'domain=.hollowbits.com;';
const COOKIE_OPTS = `path=/; max-age=604800; SameSite=Lax; Secure`; // 7 days

function setCookie(name: string, value: string): void {
  const domainPart = isOnHollowbits ? COOKIE_DOMAIN : '';
  document.cookie = `${name}=${value}; ${domainPart} ${COOKIE_OPTS}`;
}

function getCookie(name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string): void {
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `${name}=; path=/; ${expired}`;
  if (isOnHollowbits) {
    document.cookie = `${name}=; ${COOKIE_DOMAIN} path=/; ${expired}`;
  }
}

/**
 * Hybrid storage: localStorage as primary (same-domain, always reliable),
 * cookie as secondary (cross-subdomain, .hollowbits.com shared).
 *
 * The Supabase session JSON can be 3–8KB, which exceeds cookie limits.
 * We write to localStorage always. We also write to cookies but only if the
 * value fits. On play.hollowbits.com, we read localStorage first, then
 * fall back to the cookie (which would have been written by hollowbits.com).
 */
const ssoStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;

    // 1. Primary: localStorage (always try first)
    try {
      const local = window.localStorage.getItem(key);
      if (local) return local;
    } catch { /* private browsing mode may throw */ }

    // 2. Fallback: shared domain cookie
    if (typeof document !== 'undefined') {
      const cookieVal = getCookie(key);
      if (cookieVal) {
        // Promote to localStorage for future reads
        try { window.localStorage.setItem(key, cookieVal); } catch { /* ignore */ }
        return cookieVal;
      }
    }

    return null;
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;

    // Always write to localStorage
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }

    // Write to cookie only when on hollowbits.com and value fits cookie limit
    // Note: cookies have 4096 byte per-cookie limit. We allow up to 3900 chars
    // to stay safely under. Supabase session JSON is often 2–4KB encoded.
    if (isOnHollowbits && typeof document !== 'undefined') {
      try {
        const encoded = encodeURIComponent(value);
        if (encoded.length <= 3900) {
          setCookie(key, encoded);
        } else {
          // Value too large for cookie — that's OK, localStorage is reliable
          // on same-domain. Cross-domain will need token-passing instead.
          console.debug('[ssoStorage] Value too large for cookie, localStorage only:', key);
        }
      } catch { /* ignore */ }
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
    if (typeof document !== 'undefined') deleteCookie(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ssoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
