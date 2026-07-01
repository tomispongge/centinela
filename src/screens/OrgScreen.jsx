import { useState, useEffect } from 'react';
import { sb } from '../lib/supabase';
import { CARD } from '../lib/constants';
import Icon from '../components/common/Icon';
import Button from '../components/common/Button';
import Field from '../components/common/Field';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';

// ════════════════════════════════════════════════════
// OrgScreen — configuración del organismo (guardada en profiles del usuario).
// 3 modos: aviso si miembro sin config · solo-lectura · formulario (admin editando).
// Portado del HTML original.
// ════════════════════════════════════════════════════
export default function OrgScreen({ userId, role }) {
  const isAdmin = role === 'admin';
  const [f, setF] = useState({
    org_name: '', org_region: '', org_ciudad: '', org_tipo_oiv: '',
    org_nivel_complejidad: '', org_usuarios_activos: '', org_equipo_seguridad: '',
    encargado_nombre: '', encargado_correo: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
      if (data) setF(p => ({ ...p, ...data }));
      setLoading(false);
    })();
  }, [userId]);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    await sb.from('profiles').upsert({ id: userId, ...f });
    setSaving(false); setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = f.org_name
    ? f.org_name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (loading) return <Spinner />;

  // Miembros (solo lectura) sin configuración cargada: aviso amable, nunca el formulario
  if (!isAdmin && !f.org_name) {
    return (
      <div style={CARD}>
        <EmptyState icon="building-2" msg="La configuración del organismo aún no ha sido completada por un administrador." />
      </div>
    );
  }

  // Modo de solo lectura: para miembros siempre, y para admin cuando no está editando
  if (!isAdmin || (!isEditing && f.org_name)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000 }}>
        <div className="org-header" style={{ ...CARD, display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', flexShrink: 0,
            background: 'var(--grad-shield)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 26, color: '#fff' }}>
            {initials}
          </div>
          <div className="org-header-info" style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text-strong)' }}>
              {f.org_name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {f.org_tipo_oiv} · {f.org_ciudad}
            </p>
          </div>
          {isAdmin && <Button onClick={() => setIsEditing(true)}><Icon name="pencil" size={15} /> Editar</Button>}
        </div>

        <div style={CARD}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 18 }}>
            Información del organismo
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, fontSize: 13.5 }}>
            {[
              ['Nombre', f.org_name], ['Región', f.org_region || '—'], ['Ciudad', f.org_ciudad || '—'],
              ['Tipo OIV', f.org_tipo_oiv || '—'], ['Complejidad', f.org_nivel_complejidad || '—'],
              ['Usuarios activos', f.org_usuarios_activos || '—'], ['Equipo seguridad', f.org_equipo_seguridad || '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ color: 'var(--text-faint)', fontSize: 10.5, marginBottom: 6, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ color: 'var(--text-strong)', fontSize: 14, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={CARD}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 18 }}>
            Encargado de ciberseguridad
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {[['Nombre', f.encargado_nombre || '—'], ['Correo electrónico', f.encargado_correo || '—']].map(([label, value]) => (
              <div key={label}>
                <div style={{ color: 'var(--text-faint)', fontSize: 10.5, marginBottom: 6, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ color: 'var(--text-strong)', fontSize: 14, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Modo de edición
  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      {/* Header card */}
      <div className="org-header" style={{ ...CARD, display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', flexShrink: 0,
          background: 'var(--grad-shield)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 26, color: '#fff' }}>
          {initials}
        </div>
        <div className="org-header-info" style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text-strong)' }}>
            {f.org_name || 'Configura tu organismo'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {f.org_tipo_oiv || 'Tipo de OIV no configurado'} · {f.org_ciudad || '—'}
          </p>
        </div>
        <div className="org-header-actions" style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Button type="submit" disabled={saving} variant={saved ? 'success' : 'primary'}>
            {saving ? 'Guardando…' : saved ? <><Icon name="check" size={15} /> ¡Guardado!</> : 'Guardar cambios'}
          </Button>
          <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
        </div>
      </div>

      <div style={CARD}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 20 }}>
          Información del organismo
        </h3>
        <Field label="Nombre del organismo">
          <input value={f.org_name} onChange={e => s('org_name', e.target.value)} placeholder="Ej: Hospital Dr. Sótero del Río" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Región"><input value={f.org_region} onChange={e => s('org_region', e.target.value)} placeholder="Región Metropolitana" /></Field>
          <Field label="Ciudad"><input value={f.org_ciudad} onChange={e => s('org_ciudad', e.target.value)} placeholder="Santiago" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <Field label="Tipo de OIV">
            <input value={f.org_tipo_oiv} onChange={e => s('org_tipo_oiv', e.target.value)} placeholder="Centro de salud de importancia vital" />
          </Field>
          <Field label="Nivel de complejidad">
            <select value={f.org_nivel_complejidad} onChange={e => s('org_nivel_complejidad', e.target.value)}>
              <option value="">Seleccionar…</option>
              {['Bajo','Medio','Alto','Crítico'].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Usuarios activos">
            <input type="number" value={f.org_usuarios_activos} onChange={e => s('org_usuarios_activos', e.target.value)} placeholder="1247" />
          </Field>
          <Field label="Equipo de seguridad (personas)">
            <input type="number" value={f.org_equipo_seguridad} onChange={e => s('org_equipo_seguridad', e.target.value)} placeholder="8" />
          </Field>
        </div>
      </div>

      <div style={CARD}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 20 }}>
          Encargado de ciberseguridad
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Nombre completo">
            <input value={f.encargado_nombre} onChange={e => s('encargado_nombre', e.target.value)} placeholder="Dr. José García Rodríguez" />
          </Field>
          <Field label="Correo electrónico">
            <input type="email" value={f.encargado_correo} onChange={e => s('encargado_correo', e.target.value)} placeholder="encargado@organismo.cl" />
          </Field>
        </div>
      </div>
    </form>
  );
}
