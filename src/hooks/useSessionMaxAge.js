import { useEffect, useRef } from 'react';

const KEY = 'cs_login_at';

// ════════════════════════════════════════════════════
// useSessionMaxAge — tope ABSOLUTO de sesión, contado desde el login.
// A diferencia del auto-logout por inactividad, este cuenta desde el momento
// del login y SOBREVIVE al cierre de la ventana (guarda el timestamp en
// localStorage). Al reabrir, si ya se pasó el tope, cierra la sesión.
//
// Es un control de higiene del lado cliente (no una barrera dura: la sesión
// real la gobierna Supabase, y este valor es editable en localStorage, igual
// que los chequeos isAdmin de UI). Complementa a MFA + inactividad.
// ════════════════════════════════════════════════════
export function useSessionMaxAge(active, onExpire, maxMs) {
  const cb = useRef(onExpire);
  cb.current = onExpire;
  const wasActive = useRef(false);

  useEffect(() => {
    if (!active) {
      // Solo limpiar al desloguear de verdad, no durante la carga inicial
      // (así no se reinicia el conteo en cada apertura).
      if (wasActive.current) localStorage.removeItem(KEY);
      wasActive.current = false;
      return;
    }
    wasActive.current = true;

    let loginAt = Number(localStorage.getItem(KEY)) || 0;
    if (!loginAt) { loginAt = Date.now(); localStorage.setItem(KEY, String(loginAt)); }

    const remaining = maxMs - (Date.now() - loginAt);
    if (remaining <= 0) { cb.current(); return; }

    const t = setTimeout(() => cb.current(), remaining);
    return () => clearTimeout(t);
  }, [active, maxMs]);
}
