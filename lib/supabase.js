import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url)  throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL');
if (!svc)  throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');

// Cliente admin (server-side únicamente — bypasea RLS)
export const supabaseAdmin = createClient(url, svc, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Cliente público (no exponer service key al browser)
export const supabasePublic = createClient(url, anon ?? '');
