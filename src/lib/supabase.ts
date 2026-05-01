import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

// Helper for cross-domain cookie storage
const ssoStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    // Fallback to localStorage for migration
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      const domain = window.location.hostname.includes('hollowbits.com') 
        ? 'domain=.hollowbits.com;' 
        : '';
      document.cookie = `${key}=${encodeURIComponent(value)}; ${domain} path=/; max-age=31536000; SameSite=Lax; Secure`;
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      const domain = window.location.hostname.includes('hollowbits.com') 
        ? 'domain=.hollowbits.com;' 
        : '';
      document.cookie = `${key}=; ${domain} path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      window.localStorage.removeItem(key);
    }
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ssoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
