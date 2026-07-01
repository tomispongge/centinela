import { useState, useEffect, useCallback } from 'react';
import { sb } from '../lib/supabase';
import { CARD } from '../lib/constants';
import { fmtDate } from '../lib/format';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Field from '../components/common/Field';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';

// ════════════════════════════════════════════════════
// UsersScreen — gestión de usuarios y accesos (solo admin).
// Invitaciones por link (válidas 7 días), equipo y cambio de roles.
// Portado del HTML original.
// ════════════════════════════════════════════════════
export default function UsersScreen({ userId, orgId, role }) {
  const isAdmin = role === 'admin';
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail]     = useState('');
  const [invRole, setInvRole] = useState('member');
  const [genLink, setGenLink] = useState(null);
  const [copied, setCopied]   = useState(false);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    const [{ data: mem }, { data: inv }] = await Promise.all([
      sb.rpc('list_org_members'),
      sb.from('invites').select('*').eq('used', false).order('created_at', { ascending: false }),
    ]);
    setMembers(mem || []);
    setInvites((inv || []).filter(i => new Date(i.expires_at) > new Date()));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!isAdmin) return <div style={CARD}><EmptyState icon="lock" msg="Solo los administradores pueden gestionar usuarios." /></div>;
  if (loading) return <Spinner />;

  const createInvite = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(''); setGenLink(null); setCopied(false);
    const mail = email.trim().toLowerCase();
    if (!mail) { setError('Ingresa un correo electrónico.'); return; }
    setBusy(true);
    try {
      const token = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
      const { error: err } = await sb.from('invites').insert({ org_id: orgId, email: mail, role: invRole, token, created_by: userId });
      if (err) { setError(err.message || 'No se pudo crear la invitación.'); return; }
      setGenLink(`${window.location.origin}/?token=${token}`);
      setEmail('');
      await load();
    } catch (ex) {
      console.error('Error creando invitación:', ex);
      setError('Ocurrió un error al crear la invitación. Revisa la consola.');
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (uid, newRole) => {
    await sb.from('memberships').update({ role: newRole }).eq('user_id', uid).eq('org_id', orgId);
    load();
  };
  const removeMember = async (uid) => {
    if (uid === userId) { alert('No puedes quitar tu propio acceso.'); return; }
    if (!confirm('¿Quitar el acceso de este usuario a la organización?')) return;
    await sb.from('memberships').delete().eq('user_id', uid).eq('org_id', orgId);
    load();
  };
  const cancelInvite = async (id) => {
    if (!confirm('¿Cancelar esta invitación?')) return;
    await sb.from('invites').delete().eq('id', id);
    load();
  };
  const copyLink = () => { try { navigator.clipboard.writeText(genLink); setCopied(true); } catch (e) {} };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>
      {/* Invitar */}
      <div style={CARD}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 16 }}>
          Invitar usuario
        </h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <Field label="Correo electrónico">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createInvite(e); }} placeholder="persona@inc.cl" />
            </Field>
          </div>
          <div style={{ flex: '0 0 150px' }}>
            <Field label="Rol">
              <select value={invRole} onChange={e => setInvRole(e.target.value)}>
                <option value="member">Miembro (solo lectura)</option>
                <option value="admin">Administrador</option>
              </select>
            </Field>
          </div>
          <Button onClick={createInvite} disabled={busy} style={{ marginBottom: 16 }}>{busy ? 'Generando…' : <><Icon name="user-plus" size={15} /> Generar link</>}</Button>
        </div>
        {error && <p style={{ color: 'var(--danger-300)', fontSize: 12.5, marginTop: 10 }}>{error}</p>}
        {genLink && (
          <div style={{ marginTop: 16, padding: 14, background: 'rgba(86,194,240,.1)', border: '1px solid rgba(86,194,240,.3)', borderRadius: 8 }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
              Comparte este link con la persona (válido 7 días). Al registrarse recibirá un correo de confirmación.
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
      </div>

      {/* Equipo */}
      <div style={CARD}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 16 }}>
          Equipo ({members.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {members.map(m => (
            <div key={m.user_id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 8px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              <span style={{ flex: '1 1 200px', fontSize: 13.5, color: 'var(--text-body)', wordBreak: 'break-all' }}>
                {m.email}{m.user_id === userId && <span style={{ color: 'var(--text-faint)' }}> (tú)</span>}
              </span>
              <select value={m.role} disabled={m.user_id === userId} onChange={e => changeRole(m.user_id, e.target.value)}
                style={{ fontSize: 12, padding: '4px 8px', cursor: m.user_id === userId ? 'not-allowed' : 'pointer' }}>
                <option value="member">Miembro</option>
                <option value="admin">Administrador</option>
              </select>
              {m.user_id !== userId && (
                <button title="Quitar acceso" onClick={() => removeMember(m.user_id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', padding: 5 }}>
                  <Icon name="user-minus" size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invitaciones pendientes */}
      {invites.length > 0 && (
        <div style={CARD}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 16 }}>
            Invitaciones pendientes ({invites.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {invites.map(i => (
              <div key={i.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 8px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                <span style={{ flex: '1 1 200px', fontSize: 13, color: 'var(--text-body)', wordBreak: 'break-all' }}>{i.email}</span>
                <Badge tone="warn">{i.role === 'admin' ? 'Admin' : 'Miembro'}</Badge>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Expira {fmtDate(i.expires_at)}</span>
                <button title="Cancelar invitación" onClick={() => cancelInvite(i.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', padding: 5 }}>
                  <Icon name="trash-2" size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
