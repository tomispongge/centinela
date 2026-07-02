import { sb } from '../lib/supabase';

// ════════════════════════════════════════════════════
// Solicitudes de salida del organismo.
// ════════════════════════════════════════════════════

export async function requestLeave() {
  const { error } = await sb.rpc('request_leave');
  if (error) throw new Error(error.message);
}

// Mi solicitud pendiente (si existe).
export async function getMyPendingLeave(userId) {
  const { data } = await sb.from('leave_requests')
    .select('*').eq('user_id', userId).eq('status', 'pending').maybeSingle();
  return data || null;
}

// Solicitudes pendientes de MIEMBROS de una org (para el admin).
export async function listMemberLeaveRequests(orgId) {
  const { data } = await sb.from('leave_requests')
    .select('*').eq('org_id', orgId).eq('role', 'member').eq('status', 'pending')
    .order('created_at');
  return data || [];
}

// Solicitudes pendientes de ADMINS (para el master).
export async function listAdminLeaveRequests() {
  const { data } = await sb.from('leave_requests')
    .select('*').eq('role', 'admin').eq('status', 'pending').order('created_at');
  return data || [];
}

export async function approveLeave(id) {
  const { error } = await sb.rpc('approve_leave_request', { p_request_id: id });
  if (error) throw new Error(error.message);
}

export async function rejectLeave(id) {
  const { error } = await sb.rpc('reject_leave_request', { p_request_id: id });
  if (error) throw new Error(error.message);
}
