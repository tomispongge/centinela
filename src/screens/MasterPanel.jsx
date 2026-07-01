import { useState, useEffect, useCallback } from 'react';
import { listOrganizations, getOrganization, createOrganization, updateOrganization } from '../services/master';
import { CARD } from '../lib/constants';
import Icon from '../components/common/Icon';
import Button from '../components/common/Button';
import Field from '../components/common/Field';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import CsShieldLogo from '../components/common/CsShieldLogo';

// ════════════════════════════════════════════════════
// MasterPanel — panel del super-admin (master). Fuera del flujo por organización:
// crea, lista y edita organismos. No accede al contenido de los hospitales.
// ════════════════════════════════════════════════════
export default function MasterPanel({ user, onLogout }) {
  const [orgs, setOrgs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing]   = useState(null);   // organismo completo en edición
  const [genLink, setGenLink]   = useState(null);
  const [copied, setCopied]     = useState(false);

  const load = useCallback(async () => {
    try { setOrgs(await listOrganizations()); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openEdit = async (o) => {
    try { setEditing(await getOrganization(o.id)); } catch (e) { alert(e.message); }
  };

  const copyLink = () => { try { navigator.clipboard.writeText(genLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {} };

  return (
    <div style={{ flex: 1, width: '100%', minWidth: 0, overflowY: 'auto', maxHeight: '100vh' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 28px', borderBottom: '1px solid var(--border-subtle)' }}>
        <CsShieldLogo size={30} gradId="master-shield" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text-strong)' }}>Cyber-Sentinel · Master</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: 'var(--text-faint)' }}>PANEL DE ADMINISTRACIÓN</div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</span>
        <button onClick={onLogout} title="Cerrar sesión"
          style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 6 }}>
          <Icon name="log-out" size={16} />
        </button>
      </header>

      <div style={{ padding: 28, maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--text-strong)' }}>
            Organismos
          </h1>
          <Button onClick={() => { setGenLink(null); setCreating(true); }}><Icon name="plus" /> Crear organismo</Button>
        </div>

        {/* Link de invitación recién generado */}
        {genLink && (
          <div style={{ ...CARD, background: 'rgba(86,194,240,.1)', border: '1px solid rgba(86,194,240,.3)' }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
              Organismo creado. Comparte este link con el administrador (válido 7 días):
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input readOnly value={genLink} onFocus={e => e.target.select()}
                style={{ flex: 1, minWidth: 220, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }} />
              <Button size="sm" variant={copied ? 'success' : 'primary'} onClick={copyLink}>
                {copied ? <><Icon name="check" size={14} /> Copiado</> : <><Icon name="copy" size={14} /> Copiar</>}
              </Button>
            </div>
          </div>
        )}

        {loading
          ? <Spinner />
          : orgs.length === 0
            ? <div style={CARD}><EmptyState icon="building-2" msg="Aún no hay organismos. Crea el primero." /></div>
            : <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
                {orgs.map((o, idx) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                    borderBottom: idx < orgs.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-strong)' }}>{o.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {o.org_tipo_oiv || 'Sin tipo'}{o.org_ciudad ? ` · ${o.org_ciudad}` : ''} · {o.members} miembro{o.members === 1 ? '' : 's'}, {o.admins} admin{o.admins === 1 ? '' : 's'}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(o)}><Icon name="pencil" size={14} /> Editar</Button>
                  </div>
                ))}
              </div>
        }
      </div>

      {creating && (
        <OrgFormModal
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={(link) => { setCreating(false); setGenLink(link); setCopied(false); load(); }}
        />
      )}
      {editing && (
        <OrgFormModal
          mode="edit"
          org={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function OrgFormModal({ mode, org, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const [f, setF] = useState({
    org_name: org?.name || '',
    admin_email: '',
    org_region: org?.org_region || '',
    org_ciudad: org?.org_ciudad || '',
    org_tipo_oiv: org?.org_tipo_oiv || '',
    org_nivel_complejidad: org?.org_nivel_complejidad || '',
    org_usuarios_activos: org?.org_usuarios_activos ?? '',
    org_equipo_seguridad: org?.org_equipo_seguridad ?? '',
    encargado_nombre: org?.encargado_nombre || '',
    encargado_correo: org?.encargado_correo || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (isEdit) {
        await updateOrganization(org.id, f);
        onSaved();
      } else {
        const { invite_token } = await createOrganization(f);
        onSaved(`${window.location.origin}/?token=${invite_token}`);
      }
    } catch (err) {
      setError(err.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Editar organismo' : 'Crear organismo'} onClose={onClose} width={640}>
      <form onSubmit={submit}>
        {!isEdit && (
          <Field label="Correo del administrador (recibirá la invitación)">
            <input type="email" required value={f.admin_email} onChange={e => s('admin_email', e.target.value)} placeholder="admin@hospital.cl" />
          </Field>
        )}
        <Field label="Nombre del organismo">
          <input required value={f.org_name} onChange={e => s('org_name', e.target.value)} placeholder="Ej: Hospital Dr. Sótero del Río" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Región"><input value={f.org_region} onChange={e => s('org_region', e.target.value)} placeholder="Región Metropolitana" /></Field>
          <Field label="Ciudad"><input value={f.org_ciudad} onChange={e => s('org_ciudad', e.target.value)} placeholder="Santiago" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <Field label="Tipo de OIV"><input value={f.org_tipo_oiv} onChange={e => s('org_tipo_oiv', e.target.value)} placeholder="Centro de salud de importancia vital" /></Field>
          <Field label="Nivel de complejidad">
            <select value={f.org_nivel_complejidad} onChange={e => s('org_nivel_complejidad', e.target.value)}>
              <option value="">Seleccionar…</option>
              {['Bajo','Medio','Alto','Crítico'].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Usuarios activos"><input type="number" value={f.org_usuarios_activos} onChange={e => s('org_usuarios_activos', e.target.value)} placeholder="1247" /></Field>
          <Field label="Equipo de seguridad (personas)"><input type="number" value={f.org_equipo_seguridad} onChange={e => s('org_equipo_seguridad', e.target.value)} placeholder="8" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Encargado de ciberseguridad"><input value={f.encargado_nombre} onChange={e => s('encargado_nombre', e.target.value)} placeholder="Nombre completo" /></Field>
          <Field label="Correo del encargado"><input type="email" value={f.encargado_correo} onChange={e => s('encargado_correo', e.target.value)} placeholder="encargado@hospital.cl" /></Field>
        </div>
        {error && <p style={{ color: 'var(--danger-300)', fontSize: 12.5, marginTop: 4 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear organismo'}</Button>
        </div>
      </form>
    </Modal>
  );
}
