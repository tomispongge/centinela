import { createClient } from '@supabase/supabase-js';

// ════════════════════════════════════════════════════
// Cliente Supabase — SINGLETON.
// Se instancia una sola vez y se exporta. Nunca crear más de una
// instancia: rompe la sesión/realtime.
// Credenciales vía variables de entorno VITE_ (ver .env / .env.example).
// ════════════════════════════════════════════════════
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const NOT_CONFIGURED =
  !SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('TU_PROYECTO');

export const sb = NOT_CONFIGURED
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
