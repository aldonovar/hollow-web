import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

// Implementación de almacenamiento en cookies para compartir sesión entre subdominios
const getCookieDomain = () => {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname;
  if (hostname.includes('hollowbits.com')) {
    return '.hollowbits.com';
  }
  return undefined;
};

const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + encodeURIComponent(key) + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    const domain = getCookieDomain();
    let cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
    if (domain) {
      cookie += `; domain=${domain}`;
    }
    // Asegurarnos de que funcione en https
    if (window.location.protocol === 'https:') {
      cookie += '; Secure';
    }
    document.cookie = cookie;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    const domain = getCookieDomain();
    let cookie = `${encodeURIComponent(key)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    if (domain) {
      cookie += `; domain=${domain}`;
    }
    document.cookie = cookie;
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: cookieStorage,
  },
});
