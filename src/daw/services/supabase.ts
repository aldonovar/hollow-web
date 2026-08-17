// Re-export the single browser client so every DAW surface shares the same
// origin-bound PKCE session without duplicating auth configuration.
export { supabase } from '../../lib/supabase';
