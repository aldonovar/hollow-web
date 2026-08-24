import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { assertDawfiSupabaseUrl } from './authContract';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

const runtimeSupabaseUrl = assertDawfiSupabaseUrl(supabaseUrl);

export const supabase = createClient<Database>(runtimeSupabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
