import { useState, useEffect } from 'react';
import { sb, NOT_CONFIGURED } from '../lib/supabase';

// ════════════════════════════════════════════════════
// useAuth — sesión del usuario.
// getUser inicial + suscripción a onAuthStateChange (con limpieza, así que
// es seguro bajo StrictMode: se desuscribe y re-suscribe, queda 1 suscripción).
// Portado de la lógica de auth del App original.
// ════════════════════════════════════════════════════
export function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (NOT_CONFIGURED) { setLoading(false); return; }
    sb.auth.getUser().then(({ data: { user } }) => { setUser(user); setLoading(false); });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => {
      // Supabase re-emite eventos al recuperar el foco de la pestaña. Si es el
      // MISMO usuario, conservamos el objeto anterior para no re-renderizar ni
      // re-disparar useMembership (evita que se cierre el modal / recargue todo).
      const next = session?.user ?? null;
      setUser(prev => (prev?.id === next?.id ? prev : next));
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => sb.auth.signOut();

  return { user, setUser, loading, signOut };
}
