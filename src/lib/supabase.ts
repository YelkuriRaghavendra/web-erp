import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isConfigured =
  supabaseUrl     && supabaseUrl     !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here';

if (!isConfigured) {
  console.warn(
    '[GasERP] Supabase not configured — running in offline (localStorage) mode.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to enable cloud sync.'
  );
}

export const supabase = createClient(
  supabaseUrl     ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key'
);

export const supabaseReady = !!isConfigured;
