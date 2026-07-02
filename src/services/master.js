import { sb } from '../lib/supabase';

// ════════════════════════════════════════════════════
// Operaciones del master (super-admin de plataforma).
// Todas se apoyan en la RLS / RPCs de Supabase (Fases A y B).
// ════════════════════════════════════════════════════

export async function isPlatformAdmin() {
  const { data } = await sb.rpc('is_platform_admin');
  return !!data;
}

export async function listOrganizations() {
  const { data, error } = await sb.rpc('list_organizations');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getOrganization(orgId) {
  const { data, error } = await sb.from('organizations').select('*').eq('id', orgId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Crea organismo + invitación del admin (RPC atómica). Devuelve { org_id, invite_token }.
export async function createOrganization(f) {
  const num = v => (v === '' || v == null ? null : Number(v));
  const { data, error } = await sb.rpc('create_organization_with_admin', {
    p_org_name:              f.org_name,
    p_admin_email:           f.admin_email,
    p_org_region:            f.org_region || null,
    p_org_ciudad:            f.org_ciudad || null,
    p_org_tipo_oiv:          f.org_tipo_oiv || null,
    p_org_nivel_complejidad: f.org_nivel_complejidad || null,
    p_org_usuarios_activos:  num(f.org_usuarios_activos),
    p_org_equipo_seguridad:  num(f.org_equipo_seguridad),
    p_encargado_nombre:      f.encargado_nombre || null,
    p_encargado_correo:      f.encargado_correo || null,
    p_request_id:            f.request_id || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data; // { org_id, invite_token }
}

// Edita los datos de un organismo (update directo; la RLS permite solo al master).
export async function updateOrganization(orgId, f) {
  const num = v => (v === '' || v == null ? null : Number(v));
  const { error } = await sb.from('organizations').update({
    name:                  f.org_name,
    org_region:            f.org_region || null,
    org_ciudad:            f.org_ciudad || null,
    org_tipo_oiv:          f.org_tipo_oiv || null,
    org_nivel_complejidad: f.org_nivel_complejidad || null,
    org_usuarios_activos:  num(f.org_usuarios_activos),
    org_equipo_seguridad:  num(f.org_equipo_seguridad),
    encargado_nombre:      f.encargado_nombre || null,
    encargado_correo:      f.encargado_correo || null,
  }).eq('id', orgId);
  if (error) throw new Error(error.message);
}

// Pausa/reanuda la visualización de un organismo (update directo; RLS = master).
export async function setOrgSuspended(orgId, suspended) {
  const { error } = await sb.from('organizations').update({ suspended }).eq('id', orgId);
  if (error) throw new Error(error.message);
}

// Cambia el admin del organismo: quita el actual e invita al nuevo. Devuelve { invite_token }.
export async function changeOrgAdmin(orgId, newEmail) {
  const { data, error } = await sb.rpc('change_org_admin', { p_org_id: orgId, p_new_email: newEmail });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

// Elimina el organismo y TODO su contenido (irreversible).
export async function deleteOrganization(orgId) {
  const { error } = await sb.rpc('delete_organization', { p_org_id: orgId });
  if (error) throw new Error(error.message);
}

// Regenera la invitación del admin pendiente (mismo correo, token nuevo).
export async function regenerateAdminInvite(orgId) {
  const { data, error } = await sb.rpc('regenerate_admin_invite', { p_org_id: orgId });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data; // { invite_token, email }
}
