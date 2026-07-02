import { useState, useEffect } from 'react';
import { sb } from '../lib/supabase';
import { CARD } from '../lib/constants';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';

// ════════════════════════════════════════════════════
// OrgScreen — información del organismo, en SOLO LECTURA.
// Lee de `organizations` (gestionada por el master). Los admin ya no la editan;
// los cambios se solicitan al administrador de la plataforma.
// ════════════════════════════════════════════════════
const LABEL = { fontSize: 10.5, color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 };
const VALUE = { fontSize: 14, color: 'var(--text-strong)', fontWeight: 500 };

function Cell({ label, value }) {
  return (
    <div>
      <div style={LABEL}>{label}</div>
      <div style={VALUE}>{value || '—'}</div>
    </div>
  );
}

export default function OrgScreen({ orgId }) {
  const [org, setOrg]         = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    (async () => {
      const { data } = await sb.from('organizations').select('*').eq('id', orgId).maybeSingle();
      setOrg(data || null);
      setLoading(false);
    })();
  }, [orgId]);

  if (loading) return <Spinner />;
  if (!org) {
    return <div style={CARD}><EmptyState icon="building-2" msg="Aún no hay información del organismo cargada por la administración." /></div>;
  }

  const initials = org.name
    ? org.name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const subtitle = [org.org_tipo_oiv, org.org_ciudad].filter(Boolean).join(' · ') || 'Sin datos';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000 }}>
      {/* Header */}
      <div className="org-header" style={{ ...CARD, display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', flexShrink: 0,
          background: 'var(--grad-shield)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 26, color: '#fff' }}>
          {initials}
        </div>
        <div className="org-header-info" style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text-strong)' }}>
            {org.name}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>
        </div>
      </div>

      {/* Información del organismo */}
      <div style={CARD}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 18 }}>
          Información del organismo
        </h3>
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
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 18 }}>
          Encargado de ciberseguridad
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Cell label="Nombre" value={org.encargado_nombre} />
          <Cell label="Correo electrónico" value={org.encargado_correo} />
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
        Estos datos los gestiona la administración de la plataforma. Para cambios, contáctala.
      </p>
    </div>
  );
}
