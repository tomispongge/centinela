import { useState, useEffect, useCallback } from 'react';
import { sb } from '../lib/supabase';
import { CARD } from '../lib/constants';
import { fmtDate } from '../lib/format';
import Icon from '../components/common/Icon';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import { requestLeave, getMyPendingLeave, listMemberLeaveRequests, approveLeave, rejectLeave } from '../services/leaveRequests';

// ════════════════════════════════════════════════════
// OrgScreen — información del organismo (solo lectura, desde `organizations`).
// Además: botón "Solicitar salida" y, para admins, las solicitudes de salida
// de sus miembros (aprobar/rechazar).
// ════════════════════════════════════════════════════
const LABEL = { fontSize: 10.5, color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 };
const VALUE = { fontSize: 14, color: 'var(--text-strong)', fontWeight: 500 };

function Cell({ label, value }) {
  return <div><div style={LABEL}>{label}</div><div style={VALUE}>{value || '—'}</div></div>;
}

export default function OrgScreen({ userId, orgId, role }) {
  const isAdmin = role === 'admin';
  const [org, setOrg]           = useState(null);
  const [myLeave, setMyLeave]   = useState(null);
  const [memberReqs, setMemberReqs] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);

  const load = useCallback(async () => {
    const [{ data: o }, mine, reqs] = await Promise.all([
      sb.from('organizations').select('*').eq('id', orgId).maybeSingle(),
      getMyPendingLeave(userId),
      isAdmin ? listMemberLeaveRequests(orgId) : Promise.resolve([]),
    ]);
    setOrg(o || null);
    setMyLeave(mine);
    setMemberReqs(reqs);
    setLoading(false);
  }, [orgId, userId, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const doRequestLeave = async () => {
    if (!confirm('¿Solicitar la salida del organismo? Un administrador (o el master, si eres admin) deberá aprobarla.')) return;
    setBusy(true);
    try { await requestLeave(); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); }
  };
  const doApprove = async (id) => {
    if (!confirm('¿Aprobar la salida de este usuario? Perderá el acceso al organismo.')) return;
    setBusy(true);
    try { await approveLeave(id); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); }
  };
  const doReject = async (id) => {
    setBusy(true);
    try { await rejectLeave(id); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  if (loading) return <Spinner />;
  if (!org) return <div style={CARD}><EmptyState icon="building-2" msg="Aún no hay información del organismo cargada por la administración." /></div>;

  const initials = org.name ? org.name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  const subtitle = [org.org_tipo_oiv, org.org_ciudad].filter(Boolean).join(' · ') || 'Sin datos';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000 }}>
      {/* Header */}
      <div className="org-header" style={{ ...CARD, display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', flexShrink: 0,
          background: 'var(--grad-shield)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 26, color: '#fff' }}>{initials}</div>
        <div className="org-header-info" style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text-strong)' }}>{org.name}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>
        </div>
      </div>

      {/* Información */}
      <div style={CARD}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 18 }}>Información del organismo</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <Cell label="Nombre" value={org.name} />
          <Cell label="Región" value={org.org_region} />
          <Cell label="Ciudad" value={org.org_ciudad} />
          <Cell label="Tipo OIV" value={org.org_tipo_oiv} />
          <Cell label="Complejidad" value={org.org_nivel_complejidad} />
          <Cell label="Usuarios activos" value={org.org_usuarios_activos} />
          <Cell label="Equipo seguridad" value={org.org_equipo_seguridad} />
        </div>
      </div>

      {/* Encargado */}
      <div style={CARD}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 18 }}>Encargado de ciberseguridad</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Cell label="Nombre" value={org.encargado_nombre} />
          <Cell label="Correo electrónico" value={org.encargado_correo} />
        </div>
      </div>

      {/* Solicitudes de salida (solo admin) */}
      {isAdmin && memberReqs.length > 0 && (
        <div style={CARD}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 6 }}>
            Solicitudes de salida ({memberReqs.length})
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>Miembros que pidieron salir del organismo.</p>
          {memberReqs.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              <span style={{ flex: '1 1 200px', fontSize: 13.5, color: 'var(--text-body)', wordBreak: 'break-all' }}>{r.email}</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(r.created_at)}</span>
              <Button size="sm" variant="success" onClick={() => doApprove(r.id)} disabled={busy}>Aprobar salida</Button>
              <Button size="sm" variant="ghost" onClick={() => doReject(r.id)} disabled={busy}>Rechazar</Button>
            </div>
          ))}
        </div>
      )}

      {/* Salida del organismo (todos) */}
      <div style={{ ...CARD, border: '1px solid rgba(252,165,184,.28)' }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text-strong)', marginBottom: 6 }}>Salida del organismo</h3>
        {myLeave ? (
          <p style={{ fontSize: 13, color: 'var(--warning-300)' }}>
            <Icon name="alert-triangle" size={14} /> Tu solicitud de salida está pendiente de aprobación
            {isAdmin ? ' del master.' : ' de un administrador.'}
          </p>
        ) : (
          <>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>
              {isAdmin ? 'Tu salida la aprueba el administrador de la plataforma.' : 'Tu salida la aprueba un administrador del organismo.'}
            </p>
            <Button variant="danger" size="sm" onClick={doRequestLeave} disabled={busy}>
              <Icon name="log-out" size={14} /> Solicitar salida del organismo
            </Button>
          </>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
        Los datos del organismo los gestiona la administración de la plataforma. Para cambios, contáctala.
      </p>
    </div>
  );
}
