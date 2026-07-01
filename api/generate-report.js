import { createClient } from '@supabase/supabase-js';
import { buildReportPrompt } from './_lib/report-prompt.js';
import { callAI } from './_lib/ai-providers.js';

// ════════════════════════════════════════════════════
// POST /api/generate-report
// Serverless Function de Vercel (Node). Corre en el servidor: la key de la IA
// nunca llega al navegador.
//
// Flujo:
//  1. Valida el token de Supabase del usuario (RLS aplica como ese usuario).
//  2. Deriva su organización desde memberships (no se confía en el cliente).
//  3. Junta datos de cumplimiento SIN PII (nombres/correos excluidos).
//  4. Arma el prompt y llama a la IA vía el adaptador (Gemini por defecto).
//  5. Devuelve el informe en Markdown.
// ════════════════════════════════════════════════════
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Falta el token de sesión.' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    res.status(500).json({ error: 'Faltan las credenciales de Supabase en el servidor.' });
    return;
  }

  // Cliente Supabase con el token del usuario → respeta la RLS.
  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    res.status(401).json({ error: 'Sesión inválida.' });
    return;
  }

  // Organización del usuario (derivada del servidor).
  const { data: membership } = await supabase
    .from('memberships').select('org_id').eq('user_id', user.id).limit(1).maybeSingle();
  if (!membership) {
    res.status(403).json({ error: 'El usuario no pertenece a ninguna organización.' });
    return;
  }
  const orgId = membership.org_id;

  // Datos para el informe. La selección de columnas EXCLUYE PII a propósito
  // (nada de responsable, encargado, reported_by, owner).
  const [{ data: objectives }, { data: incidents }, { data: evidence }, { data: profile }] = await Promise.all([
    supabase.from('objectives').select('code,name,plazo,tasks(done)').eq('org_id', orgId).order('code'),
    supabase.from('incidents').select('title,severity,sev_label,status,incident_date').eq('org_id', orgId),
    supabase.from('evidence').select('objective_code,status').eq('org_id', orgId),
    supabase.from('profiles').select('org_name,org_tipo_oiv,org_region,org_ciudad,org_nivel_complejidad').eq('id', user.id).maybeSingle(),
  ]);

  const prompt = buildReportPrompt({
    objectives: objectives || [],
    incidents: incidents || [],
    evidence: evidence || [],
    profile: profile || {},
  });

  try {
    const report = await callAI(prompt);
    res.status(200).json({ report, generated_at: new Date().toISOString() });
  } catch (e) {
    console.error('Error generando el informe:', e);
    res.status(502).json({ error: 'No se pudo generar el informe con la IA. Revisa la configuración del proveedor.' });
  }
}
