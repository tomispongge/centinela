import { useState, useEffect, useCallback } from 'react';
import { sb } from '../lib/supabase';
import { CARD, SEV_LABEL } from '../lib/constants';
import { fmtDate } from '../lib/format';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Field from '../components/common/Field';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';

// ════════════════════════════════════════════════════
// IncidentsScreen — registro de incidentes de seguridad.
// Escritura solo admin (gating de UI; la RLS enforcea de verdad).
// Numeración: INC-{año}-{correlativo 4 dígitos}. Portado del HTML original.
// ════════════════════════════════════════════════════
export default function IncidentsScreen({ userId, orgId, role }) {
  const isAdmin = role === 'admin';
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [detail, setDetail]       = useState(null);

  const load = useCallback(async () => {
    const { data } = await sb.from('incidents').select('*').eq('org_id', orgId).order('incident_date', { ascending: false });
    setIncidents(data || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (modal?.id) {
      await sb.from('incidents').update(form).eq('id', modal.id);
    } else {
      const year = new Date().getFullYear();
      const num  = String(incidents.length + 1).padStart(4, '0');
      await sb.from('incidents').insert({ ...form, user_id: userId, org_id: orgId, incident_number: `INC-${year}-${num}` });
    }
    setModal(null); load();
  };

  const del = async (id) => {
    if (!confirm('¿Eliminar este incidente?')) return;
    await sb.from('incidents').delete().eq('id', id); load();
  };

  const changeStatus = async (id, status) => {
    await sb.from('incidents').update({ status }).eq('id', id); load();
  };

  if (loading) return <Spinner />;

  const criticals = incidents.filter(i => i.severity === 'risk' && i.status !== 'Resuelto');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {criticals.length > 0 && (
        <div style={{ ...CARD, background: 'rgba(242,86,111,.12)', border: '1px solid rgba(252,165,184,.34)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: 'var(--danger-300)', flexShrink: 0 }}><Icon name="shield-alert" /></span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>
                {criticals.length} incidente{criticals.length > 1 ? 's' : ''} crítico{criticals.length > 1 ? 's' : ''} activo{criticals.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{criticals[0].incident_number} — {criticals[0].title}</div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setModal('new')}><Icon name="plus" /> Nuevo incidente</Button>
        </div>
      )}

      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)' }}>Registro de incidentes</h3>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{incidents.length} total</span>
        </div>

        {incidents.length === 0
          ? <EmptyState icon="shield-check" msg="Sin incidentes registrados. ¡Todo en orden!" />
          : incidents.map((i, idx) => (
              <div key={i.id} style={{
                display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.6fr auto',
                gap: 14, padding: '14px 20px', alignItems: 'flex-start',
                borderBottom: idx < incidents.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13.5 }}>{i.title}</div>
                  {i.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.4 }}>{i.description}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: 'var(--text-faint)' }}>{i.incident_number}</span>
                    {i.asset && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>· {i.asset}</span>}
                  </div>
                </div>
                <Badge tone={i.severity}>{i.sev_label}</Badge>
                <select value={i.status} disabled={!isAdmin} onChange={e => changeStatus(i.id, e.target.value)}
                  style={{ padding: '5px 10px', fontSize: 12, borderRadius: 'var(--radius-pill)', cursor: isAdmin ? 'pointer' : 'default' }}>
                  {['En detección','En análisis','En contención','Asignado','En remediación','Resuelto'].map(s => <option key={s}>{s}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setDetail(i)} title="Ver detalle"
                    style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 5 }}>
                    <Icon name="eye" size={15} />
                  </button>
                  {isAdmin && <button onClick={() => setModal(i)} title="Editar"
                    style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 5 }}>
                    <Icon name="pencil" size={15} />
                  </button>}
                  {isAdmin && <button onClick={() => del(i.id)} title="Eliminar"
                    style={{ background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', padding: 5 }}>
                    <Icon name="trash-2" size={15} />
                  </button>}
                </div>
              </div>
            ))
        }
      </div>

      {modal && <IncModal initial={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={save} />}
      {detail && <IncDetail incident={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function IncModal({ initial, onClose, onSave }) {
  const [f, setF] = useState({
    title: initial?.title || '', description: initial?.description || '',
    severity: initial?.severity || 'warn', sev_label: initial?.sev_label || 'Medio',
    status: initial?.status || 'En detección', asset: initial?.asset || '',
    reported_by: initial?.reported_by || '', owner: initial?.owner || '',
    incident_date: initial?.incident_date ? initial.incident_date.slice(0,10) : new Date().toISOString().slice(0,10),
  });
  const [saving, setSaving] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSev = v => { s('severity', v); s('sev_label', SEV_LABEL[v]); };

  return (
    <Modal title={initial ? 'Editar incidente' : 'Nuevo incidente'} onClose={onClose} width={580}>
      <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(f); setSaving(false); }}>
        <Field label="Título del incidente">
          <input value={f.title} onChange={e => s('title', e.target.value)} placeholder="Describe brevemente el incidente" required />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Severidad">
            <select value={f.severity} onChange={e => handleSev(e.target.value)}>
              <option value="ok">Bajo</option>
              <option value="warn">Medio</option>
              <option value="risk">Crítico</option>
            </select>
          </Field>
          <Field label="Estado">
            <select value={f.status} onChange={e => s('status', e.target.value)}>
              {['En detección','En análisis','En contención','Asignado','En remediación','Resuelto'].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Fecha del incidente">
            <input type="date" value={f.incident_date} onChange={e => s('incident_date', e.target.value)} />
          </Field>
          <Field label="Activo afectado">
            <input value={f.asset} onChange={e => s('asset', e.target.value)} placeholder="Servidor, sistema, red…" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Reportado por">
            <input value={f.reported_by} onChange={e => s('reported_by', e.target.value)} placeholder="Fuente de detección" />
          </Field>
          <Field label="Responsable">
            <input value={f.owner} onChange={e => s('owner', e.target.value)} placeholder="Responsable de atención" />
          </Field>
        </div>
        <Field label="Descripción">
          <textarea value={f.description} onChange={e => s('description', e.target.value)} placeholder="Describe el incidente en detalle…" />
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : initial ? 'Actualizar' : 'Registrar incidente'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function IncDetail({ incident: i, onClose }) {
  return (
    <Modal title={i.incident_number || 'Detalle'} onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, color: 'var(--text-strong)' }}>{i.title}</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Badge tone={i.severity}>{i.sev_label}</Badge>
          <Badge tone="azul">{i.status}</Badge>
        </div>
        {i.description && <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65 }}>{i.description}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['Activo afectado', i.asset], ['Reportado por', i.reported_by], ['Responsable', i.owner], ['Fecha', fmtDate(i.incident_date)]]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 14, color: 'var(--text-body)' }}>{value}</div>
              </div>
            ))
          }
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
}
