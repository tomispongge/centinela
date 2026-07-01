import { sb } from '../lib/supabase';

// Llama a la función serverless que genera el informe con IA.
// Envía el token de la sesión para que el servidor aplique la RLS del usuario.
export async function generateReport() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('No hay una sesión activa.');

  const resp = await fetch('/api/generate-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Error ${resp.status} al generar el informe.`);
  return data; // { report, generated_at }
}
