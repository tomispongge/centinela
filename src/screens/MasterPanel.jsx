import { useState, useEffect, useCallback } from 'react';
import { listOrganizations, getOrganization, createOrganization, updateOrganization, setOrgSuspended, changeOrgAdmin, deleteOrganization, regenerateAdminInvite } from '../services/master';
import { listAdminLeaveRequests, approveLeave, rejectLeave } from '../services/leaveRequests';
import { CARD } from '../lib/constants';
import { fmtDate } from '../lib/format';
import Icon from '../components/common/Icon';
import Button from '../components/common/Button';
import Field from '../components/common/Field';
import Badge from '../components/common/Badge';
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
  const [adminReqs, setAdminReqs] = useState([]);   // solicitudes de salida de admins
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing]   = useState(null);   // organismo completo en edición
  const [genLink, setGenLink]   = useState(null);
  const [copied, setCopied]     = useState(false);
  const [busy, setBusy]         = useState(false);

  const load = useCallback(async () => {
    try {
      const [os, reqs] = await Promise.all([listOrganizations(), listAdminLeaveRequests()]);
      setOrgs(os); setAdminReqs(reqs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openEdit = async (o) => {
    try { setEditing(await getOrganization(o.id)); } catch (e) { alert(e.message); }
  };

  const approveExit = async (id) => {
    if (!confirm('¿Aprobar la salida de este administrador? Perderá el acceso al organismo.')) return;
    setBusy(true);
    try { await approveLeave(id); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); }
  };
  const rejectExit = async (id) => {
    setBusy(true);
    try { await rejectLeave(id); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const copyLink = () => { try { navigator.clipboard.writeText(genLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {} };

  const regenLink = async (o) => {
    setBusy(true); setGenLink(null); setCopied(false);
    try {
      const { invite_token } = await regenerateAdminInvite(o.id);
      setGenLink(`${window.location.origin}/?token=${invite_token}`);
      await load();
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

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

        {adminReqs.length > 0 && (
          <div style={{ ...CARD, border: '1px solid rgba(252,215,126,.34)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text-strong)', marginBottom: 6 }}>
              Solicitudes de salida de administradores ({adminReqs.length})
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>Administradores que pidieron salir de su organismo.</p>
            {adminReqs.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                <span style={{ flex: '1 1 200px', fontSize: 13.5, color: 'var(--text-body)', wordBreak: 'break-all' }}>{r.email}</span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(r.created_at)}</span>
                <Button size="sm" variant="success" onClick={() => approveExit(r.id)} disabled={busy}>Aprobar salida</Button>
                <Button size="sm" variant="ghost" onClick={() => rejectExit(r.id)} disabled={busy}>Rechazar</Button>
              </div>
            ))}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-strong)' }}>{o.name}</span>
                        {Number(o.admins) === 0 && <Badge tone="warn">Admin pendiente</Badge>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {o.org_tipo_oiv || 'Sin tipo'}{o.org_ciudad ? ` · ${o.org_ciudad}` : ''} · {o.members} miembro{o.members === 1 ? '' : 's'}, {o.admins} admin{o.admins === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {Number(o.admins) === 0 && (
                        <Button size="sm" variant="ghost" onClick={() => regenLink(o)} disabled={busy}>
                          <Icon name="copy" size={14} /> Regenerar link
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(o)}><Icon name="pencil" size={14} /> Editar</Button>
                    </div>
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
          onReload={load}
        />
      )}
    </div>
  );
}

function OrgFormModal({ mode, org, onClose, onSaved, onReload }) {
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

  // Gestión (solo edición)
  const [suspended, setSuspended] = useState(!!org?.suspended);
  const [newAdmin, setNewAdmin]   = useState('');
  const [adminLink, setAdminLink] = useState(null);
  const [busy, setBusy]           = useState(false);

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

  const togglePause = async () => {
    setBusy(true); setError('');
    try { await setOrgSuspended(org.id, !suspended); setSuspended(!suspended); onReload?.(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const doChangeAdmin = async () => {
    const email = newAdmin.trim();
    if (!email) return;
    if (!window.confirm('Esto quita el acceso del administrador actual e invita a uno nuevo. ¿Continuar?')) return;
    setBusy(true); setError(''); setAdminLink(null);
    try {
      const { invite_token } = await changeOrgAdmin(org.id, email);
      setAdminLink(`${window.location.origin}/?token=${invite_token}`);
      setNewAdmin('');
      onReload?.();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const doDelete = async () => {
    if (!window.confirm(`Vas a ELIMINAR "${f.org_name}" y TODOS sus datos (objetivos, incidentes, evidencias, usuarios). Esto es IRREVERSIBLE.\n\n¿Continuar?`)) return;
    setBusy(true); setError('');
    try { await deleteOrganization(org.id); onSaved(); }
    catch (err) { setError(err.message); setBusy(false); }
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

      {isEdit && (
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text-strong)' }}>Gestión</h4>

          {/* Pausar visualización */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>Visualización</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {suspended ? 'Pausada — los usuarios ven "organismo pausado".' : 'Activa — los usuarios acceden normalmente.'}
              </div>
            </div>
            <Button size="sm" variant={suspended ? 'success' : 'ghost'} onClick={togglePause} disabled={busy}>
              {suspended ? <><Icon name="check" size={14} /> Reanudar</> : 'Pausar'}
            </Button>
          </div>

          {/* Cambiar administrador */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>Cambiar administrador</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="email" value={newAdmin} onChange={e => setNewAdmin(e.target.value)}
                placeholder="nuevo-admin@hospital.cl" style={{ flex: '1 1 220px' }} />
              <Button size="sm" variant="ghost" onClick={doChangeAdmin} disabled={busy}>Cambiar</Button>
            </div>
            {adminLink && (
              <div style={{ marginTop: 8, padding: 12, background: 'rgba(86,194,240,.1)', border: '1px solid rgba(86,194,240,.3)', borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Comparte este link con el nuevo administrador:</p>
                <input readOnly value={adminLink} onFocus={e => e.target.select()}
                  style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }} />
              </div>
            )}
          </div>

          {error && <p style={{ color: 'var(--danger-300)', fontSize: 12.5 }}>{error}</p>}

          {/* Eliminar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger-300)' }}>Eliminar organismo</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Borra el organismo y todos sus datos. Irreversible.</div>
            </div>
            <Button size="sm" variant="danger" onClick={doDelete} disabled={busy}><Icon name="trash-2" size={14} /> Eliminar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
