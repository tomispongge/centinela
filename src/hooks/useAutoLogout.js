import { useEffect, useRef } from 'react';

// ════════════════════════════════════════════════════
// useAutoLogout — cierra la sesión tras un período de INACTIVIDAD.
// El temporizador se reinicia con cualquier interacción del usuario.
// Por defecto 1 hora. Sin costo: todo en el cliente.
// ════════════════════════════════════════════════════
export function useAutoLogout(active, onTimeout, timeoutMs = 60 * 60 * 1000) {
  // Guardamos el callback en un ref para que el efecto no dependa de su
  // identidad (así no se reinicia el temporizador en cada render).
  const cb = useRef(onTimeout);
  cb.current = onTimeout;
  const timer = useRef(null);

  useEffect(() => {
    if (!active) return;

    const reset = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => cb.current(), timeoutMs);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset(); // inicia el conteo al montar

    return () => {
      clearTimeout(timer.current);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [active, timeoutMs]);
}
