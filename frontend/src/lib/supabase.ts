import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Run ./start.ps1 (or ./start.sh) so local Supabase values are written to frontend/.env.',
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
