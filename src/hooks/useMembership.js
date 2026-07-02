import { useState, useEffect, useRef } from 'react';
import { sb } from '../lib/supabase';

// ════════════════════════════════════════════════════
// useMembership — organización (org_id) y rol del usuario.
// Si el usuario se registró con un token de invitación y aún no tiene
// membresía, canjea la invitación (redeem_invite) y recarga.
//
// BLINDAJE del canje (para StrictMode y para refrescos de token en producción):
// el canje se memoriza como una PROMESA compartida por token en un ref. Si el
// efecto se ejecuta más de una vez, todas las ejecuciones esperan el MISMO
// canje → redeem_invite se llama una sola vez, y el estado queda consistente.
// ════════════════════════════════════════════════════
export function useMembership(user) {
  const [membership, setMembership] = useState(null);
  const [suspended, setSuspended]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const redeemRef = useRef({ token: null, promise: null }); // canje en curso, por token

  useEffect(() => {
    if (!user) { setMembership(null); setLoading(false); return; }

    let active = true;
    setLoading(true);

    const fetchMembership = () =>
      sb.from('memberships').select('org_id, role').eq('user_id', user.id).limit(1).maybeSingle();

    (async () => {
      let result = null;
      let sus = false;
      try {
        let { data } = await fetchMembership();
        const token = user.user_metadata?.invite_token;

        if (!data && token) {
          // Reutiliza el canje en curso para este token (evita doble RPC).
          if (redeemRef.current.token !== token) {
            redeemRef.current = { token, promise: sb.rpc('redeem_invite', { p_token: token }) };
          }
          const { error } = await redeemRef.current.promise;
          if (error) console.error('Error canjeando invitación:', error.message);
          else ({ data } = await fetchMembership());
        }

        result = data || null;
        // Fallback: cuenta EXISTENTE re-invitada → canjea una invitación pendiente
        // dirigida a su correo (el token en metadata puede estar obsoleto).
        if (!result) {
          const { data: joinedOrg } = await sb.rpc('redeem_pending_invite');
          if (joinedOrg) { const r = await fetchMembership(); result = r.data || null; }
        }
        if (result) {
          const { data: org } = await sb.from('organizations').select('suspended').eq('id', result.org_id).maybeSingle();
          sus = !!org?.suspended;
        }
      } catch (e) {
        console.error('Error cargando membresía:', e);
      } finally {
        if (active) { setMembership(result); setSuspended(sus); setLoading(false); }
      }
    })();

    return () => { active = false; };
  }, [user]);

  return { membership, suspended, loading };
}
