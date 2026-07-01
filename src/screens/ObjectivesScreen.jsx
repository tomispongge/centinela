import { useState, useEffect, useCallback } from 'react';
import { sb } from '../lib/supabase';
import { CARD, getTone, TONE_STROKE } from '../lib/constants';
import { fmtDate } from '../lib/format';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Field from '../components/common/Field';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';

// ════════════════════════════════════════════════════
// ObjectivesScreen — objetivos COMGES con tareas y vinculación de evidencias.
// Cada tarea admite hasta 2 evidencias (evidence_id / evidence_id_2). Las
// evidencias ya usadas por cualquier tarea se excluyen de los desplegables.
// Escritura solo admin. Portado del HTML original.
// ════════════════════════════════════════════════════
export default function ObjectivesScreen({ userId, orgId, role, onNavigate, onHighlightEvidence }) {
  const isAdmin = role === 'admin';
  const [objectives, setObjectives] = useState([]);
  const [evidence, setEvidence]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [openId, setOpenId]         = useState(null);
  const [modal, setModal]           = useState(null); // null | 'new' | objective
  const [addTaskId, setAddTaskId]   = useState(null);       // objetivo con el form "agregar tarea" abierto
  const [addEvidTaskId, setAddEvidTaskId] = useState(null); // tarea con el 2º desplegable de evidencia abierto
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    const [{ data: objs }, { data: ev }] = await Promise.all([
      sb.from('objectives').select('*, tasks(*)').eq('org_id', orgId).order('code'),
      sb.from('evidence').select('id,name,objective_code').eq('org_id', orgId),
    ]);
    setObjectives(objs || []);
    setEvidence(ev || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const saveObj = async (form) => {
    setSaving(true);
    if (modal?.id) {
      await sb.from('objectives').update(form).eq('id', modal.id);
    } else {
      await sb.from('objectives').insert({ ...form, user_id: userId, org_id: orgId });
    }
    setSaving(false); setModal(null); load();
  };

  const deleteObj = async (id) => {
    if (!confirm('¿Eliminar este objetivo y todas sus tareas?')) return;
    await sb.from('objectives').delete().eq('id', id);
    load();
  };

  const toggleTask = async (taskId, done) => {
    await sb.from('tasks').update({ done: !done }).eq('id', taskId);
    load();
  };

  const addTask = async (objectiveId, name) => {
    await sb.from('tasks').insert({ objective_id: objectiveId, user_id: userId, org_id: orgId, name, done: false });
    setAddTaskId(null); load();
  };

  const deleteTask = async (taskId) => {
    await sb.from('tasks').delete().eq('id', taskId);
    load();
  };

  const saveTaskEvidence = async (taskId, patch) => {
    const { error } = await sb.from('tasks').update(patch).eq('id', taskId);
    if (error) { console.error('Error guardando evidencia:', error); alert('No se pudo guardar la evidencia. Verifica que existan las columnas evidence_id / evidence_id_2 en la tabla tasks.'); }
    else load();
  };

  // Desvincula una evidencia; si se quita la 1ª y existe la 2ª, ésta se promueve al primer slot.
  const unlinkEvidence = (task, slot) => {
    if (slot === 1) {
      if (task.evidence_id_2) saveTaskEvidence(task.id, { evidence_id: task.evidence_id_2, evidence_id_2: null });
      else saveTaskEvidence(task.id, { evidence_id: null });
    } else {
      saveTaskEvidence(task.id, { evidence_id_2: null });
    }
    setAddEvidTaskId(null);
  };

  if (loading) return <Spinner />;

  // IDs de evidencias ya vinculadas a CUALQUIER tarea (para excluirlas de los desplegables de las demás)
  const globalUsedIds = new Set();
  objectives.forEach(o => (o.tasks || []).forEach(t => {
    if (t.evidence_id)   globalUsedIds.add(t.evidence_id);
    if (t.evidence_id_2) globalUsedIds.add(t.evidence_id_2);
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
          <Button onClick={() => setModal('new')}><Icon name="plus" /> Nuevo objetivo</Button>
        </div>
      )}

      {objectives.length === 0
        ? <div style={CARD}><EmptyState icon="target" msg="Sin objetivos COMGES. Crea el primero." /></div>
        : objectives.map(o => {
            const total    = o.tasks?.length || 0;
            const done     = o.tasks?.filter(t => t.done).length || 0;
            const progress = total > 0 ? Math.round(done / total * 100) : 0;
            const tone     = getTone(progress);
            const isOpen   = openId === o.id;
            const RC       = 2 * Math.PI * 40;

            return (
              <div key={o.id} style={CARD} className="anim-fade">
                <div className="obj-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {/* Ring */}
                  <svg className="obj-ring" style={{ width: 80, height: 80, flexShrink: 0 }} viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={TONE_STROKE[tone]} strokeWidth="7"
                      strokeDasharray={`${RC * progress / 100} ${RC}`}
                      strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}/>
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
                      style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, fill: 'var(--text-strong)' }}>
                      {progress}%
                    </text>
                  </svg>

                  {/* Info */}
                  <div className="obj-info" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--celeste-300)' }}>{o.code}</span>
                      <Badge tone={tone}>{tone === 'ok' ? 'En meta' : tone === 'warn' ? 'En progreso' : 'Atrasado'}</Badge>
                      {o.plazo && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Plazo {fmtDate(o.plazo)}</span>}
                    </div>
                    <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 17, color: 'var(--text-strong)', marginBottom: 4, cursor: 'pointer' }}
                      onClick={() => setOpenId(isOpen ? null : o.id)}>
                      {o.name}
                    </h3>
                    {o.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{o.description}</p>}
                    {o.responsable && <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Responsable: {o.responsable}</p>}
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{done}/{total} tareas completadas</p>
                  </div>

                  {/* Actions */}
                  <div className="obj-actions" style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button onClick={() => setOpenId(isOpen ? null : o.id)} title="Ver tareas"
                      style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 6 }}>
                      <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} />
                    </button>
                    {isAdmin && <button onClick={() => setModal(o)} title="Editar"
                      style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 6 }}>
                      <Icon name="pencil" size={15} />
                    </button>}
                    {isAdmin && <button onClick={() => deleteObj(o.id)} title="Eliminar"
                      style={{ background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', padding: 6 }}>
                      <Icon name="trash-2" size={15} />
                    </button>}
                  </div>
                </div>

                {/* Tasks panel */}
                {isOpen && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {(o.tasks || []).length === 0 && (
                        <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Sin tareas aún. Agrega la primera.</p>
                      )}
                      {(o.tasks || []).sort((a, b) => a.done - b.done).map(t => {
                        const ev1 = evidence.find(e => e.id === t.evidence_id);
                        const ev2 = evidence.find(e => e.id === t.evidence_id_2);
                        // Evidencias disponibles para esta tarea: las que no están usadas por ninguna tarea
                        const availEv = evidence.filter(e => !globalUsedIds.has(e.id));
                        const SELECT_STYLE = { fontSize: 11, padding: '4px 8px', background: 'rgba(79,132,242,.15)', border: '1px solid rgba(79,132,242,.3)', borderRadius: '4px', color: 'var(--azul-400)', maxWidth: 220 };
                        const goToEvidence = (id) => { if (onHighlightEvidence) onHighlightEvidence(id); if (onNavigate) onNavigate('evidence'); };
                        const EvChip = ({ ev, slot }) => (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span title="Ver en Evidencias" onClick={() => goToEvidence(ev.id)}
                              style={{ fontSize: 11, color: 'var(--celeste-300)', background: 'rgba(86,194,240,.15)', padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                              <Icon name="link" size={11} /> {ev.name}
                            </span>
                            {isAdmin && slot === 1 && !ev2 && (
                              <button title="Agregar 2ª evidencia" onClick={() => setAddEvidTaskId(addEvidTaskId === t.id ? null : t.id)}
                                style={{ width: 22, height: 22, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: 'rgba(79,132,242,.15)', border: '1px solid rgba(79,132,242,.3)', borderRadius: '4px', color: 'var(--azul-400)', cursor: 'pointer' }}>+</button>
                            )}
                            {isAdmin && <button title="Desvincular evidencia" onClick={() => unlinkEvidence(t, slot)}
                              style={{ width: 22, height: 22, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--text-faint)', cursor: 'pointer' }}>×</button>}
                          </div>
                        );
                        return <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" checked={t.done} disabled={!isAdmin} onChange={() => toggleTask(t.id, t.done)} style={{ width: 17, height: 17, flexShrink: 0, cursor: isAdmin ? 'pointer' : 'default' }} />
                            <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text-body)' }}>{t.name}</span>
                            {isAdmin && <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 2, opacity: 0.5, flexShrink: 0 }}><Icon name="x" size={14} /></button>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                            {/* Evidencia 1: desplegable si no hay nada, o vínculo con +/× */}
                            {!ev1
                              ? (isAdmin
                                  ? <select value="" onChange={(e) => { if (e.target.value) saveTaskEvidence(t.id, { evidence_id: e.target.value }); }} style={SELECT_STYLE}>
                                      <option value="">{availEv.length ? 'Selecciona evidencia' : 'No hay evidencias disponibles'}</option>
                                      {availEv.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                  : <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Sin evidencia vinculada</span>)
                              : <EvChip ev={ev1} slot={1} />
                            }
                            {/* 2º desplegable: aparece DEBAJO de la evidencia ya vinculada al presionar "+" */}
                            {isAdmin && ev1 && !ev2 && addEvidTaskId === t.id && (
                              <select value="" onChange={(e) => { if (e.target.value) { saveTaskEvidence(t.id, { evidence_id_2: e.target.value }); setAddEvidTaskId(null); } }} style={SELECT_STYLE}>
                                <option value="">{availEv.length ? 'Selecciona 2ª evidencia' : 'No hay evidencias disponibles'}</option>
                                {availEv.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                              </select>
                            )}
                            {/* Evidencia 2 vinculada */}
                            {ev2 && <EvChip ev={ev2} slot={2} />}
                          </div>
                        </div>;
                      })}
                    </div>

                    {isAdmin && (addTaskId === o.id
                      ? <InlineAddTask onAdd={name => addTask(o.id, name)} onCancel={() => setAddTaskId(null)} />
                      : <Button size="sm" variant="ghost" onClick={() => setAddTaskId(o.id)}>
                          <Icon name="plus" size={14} /> Agregar tarea
                        </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
      }

      {modal !== null && (
        <ObjModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={saveObj}
          saving={saving}
        />
      )}
    </div>
  );
}

function InlineAddTask({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la tarea…" autoFocus
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onAdd(name.trim()); if (e.key === 'Escape') onCancel(); }}
        style={{ flex: 1, padding: '8px 12px', fontSize: 13 }} />
      <Button size="sm" onClick={() => name.trim() && onAdd(name.trim())}>Agregar</Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
    </div>
  );
}

function ObjModal({ initial, onClose, onSave, saving }) {
  const [f, setF] = useState({
    code: initial?.code || '', name: initial?.name || '',
    description: initial?.description || '', plazo: initial?.plazo || '',
    responsable: initial?.responsable || '',
  });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title={initial ? 'Editar objetivo' : 'Nuevo objetivo COMGES'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(f); }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Código"><input value={f.code} onChange={e => s('code', e.target.value)} placeholder="COMGES 01" required /></Field>
          <Field label="Responsable"><input value={f.responsable} onChange={e => s('responsable', e.target.value)} placeholder="Nombre responsable" /></Field>
        </div>
        <Field label="Nombre del objetivo"><input value={f.name} onChange={e => s('name', e.target.value)} placeholder="Gobernanza de ciberseguridad" required /></Field>
        <Field label="Descripción"><textarea value={f.description} onChange={e => s('description', e.target.value)} placeholder="Describe brevemente el objetivo…" /></Field>
        <Field label="Fecha límite"><input type="date" value={f.plazo} onChange={e => s('plazo', e.target.value)} /></Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : initial ? 'Actualizar' : 'Crear objetivo'}</Button>
        </div>
      </form>
    </Modal>
  );
}
