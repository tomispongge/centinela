import { useState, useEffect } from 'react';
import { sb } from '../lib/supabase';

// ════════════════════════════════════════════════════
// useIsMaster — ¿el usuario actual es el master (platform admin)?
// Llama a la RPC is_platform_admin() (que usa auth.uid() del lado servidor).
// ════════════════════════════════════════════════════
export function useIsMaster(user) {
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { setIsMaster(false); setLoading(false); return; }
    let active = true;
    setLoading(true);
    sb.rpc('is_platform_admin').then(({ data }) => {
      if (active) { setIsMaster(!!data); setLoading(false); }
    });
    return () => { active = false; };
  }, [user]);

  return { isMaster, loading };
}
