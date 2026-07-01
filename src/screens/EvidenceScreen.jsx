import { useState, useEffect, useCallback, useRef } from 'react';
import { sb } from '../lib/supabase';
import { CARD } from '../lib/constants';
import { fmtDate } from '../lib/format';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Field from '../components/common/Field';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';

// ════════════════════════════════════════════════════
// EvidenceScreen — documentos de evidencia agrupados por objetivo COMGES.
// Soporta resaltado + scroll al llegar desde un vínculo de tarea (Objetivos).
// Portado del HTML original.
// ════════════════════════════════════════════════════
export default function EvidenceScreen({ userId, orgId, role, highlightEvidence, onHighlightEvidence }) {
  const isAdmin = role === 'admin';
  const [objectives, setObjectives] = useState([]);
  const [evidence, setEvidence]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [expandedCode, setExpandedCode] = useState(null);
  const highlightRef = useRef(null);

  const load = useCallback(async () => {
    const [{ data: objs }, { data: ev }] = await Promise.all([
      sb.from('objectives').select('id,code,name').eq('org_id', orgId).order('code'),
      sb.from('evidence').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
    ]);
    setObjectives(objs || []);
    setEvidence(ev || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  // Al llegar desde un vínculo de tarea: expandir el objetivo de la evidencia resaltada
  useEffect(() => {
    if (!highlightEvidence || evidence.length === 0) return;
    const ev = evidence.find(e => e.id === highlightEvidence);
    if (ev) setExpandedCode(ev.objective_code);
  }, [highlightEvidence, evidence]);

  // Hacer scroll hacia la evidencia resaltada cuando ya está en el DOM
  useEffect(() => {
    if (highlightEvidence && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightEvidence, expandedCode]);

  const save = async (form) => {
    if (modal?.id) {
      await sb.from('evidence').update(form).eq('id', modal.id);
    } else {
      await sb.from('evidence').insert({ ...form, user_id: userId, org_id: orgId });
    }
    setModal(null); load();
  };

  const del = async (id) => {
    if (!confirm('¿Eliminar esta evidencia?')) return;
    await sb.from('evidence').delete().eq('id', id); load();
  };

  // Reasigna una evidencia huérfana a un objetivo existente.
  const reassign = async (id, code) => {
    await sb.from('evidence').update({ objective_code: code }).eq('id', id);
    load();
  };

  if (loading) return <Spinner />;

  // Evidencias huérfanas: su objective_code no coincide con ningún objetivo actual
  // (su objetivo fue borrado o le cambiaron el código). Quedaban invisibles aquí.
  const objCodes = new Set(objectives.map(o => o.code));
  const orphans = evidence.filter(e => !objCodes.has(e.objective_code));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
          <Button onClick={() => setModal('new')} disabled={objectives.length === 0}>
            <Icon name="plus" /> Agregar evidencia
          </Button>
        </div>
      )}
      {objectives.length === 0
        ? <div style={CARD}><EmptyState icon="file-check-2" msg="Primero crea objetivos COMGES para asignar evidencias." /></div>
        : objectives.map(obj => {
            const docs   = evidence.filter(e => e.objective_code === obj.code);
            const isOpen = expandedCode === obj.code;
            return (
              <div key={obj.id} style={CARD}>
                <button onClick={() => setExpandedCode(isOpen ? null : obj.code)}
                  style={{ width: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--celeste-300)' }}>{obj.code}</span>
                      {docs.length > 0
                        ? <Badge tone="ok">{docs.length} doc{docs.length > 1 ? 's' : ''}</Badge>
                        : <Badge tone="risk">Sin evidencia</Badge>
                      }
                    </div>
                    <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text-strong)' }}>{obj.name}</h3>
                  </div>
                  <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} />
                </button>

                {isOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                    {docs.length === 0
                      ? <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 10 }}>Sin documentos para este objetivo.</p>
                      : docs.map(doc => {
                          const statusTone = doc.status === 'Aprobado' ? 'ok' : doc.status === 'Rechazado' ? 'risk' : 'warn';
                          const isHL = doc.id === highlightEvidence;
                          return (
                            <div key={doc.id} ref={isHL ? highlightRef : null} className="ev-doc-row"
                              onClick={() => { if (isHL && onHighlightEvidence) onHighlightEvidence(null); }}
                              style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 8px', borderRadius: 8, marginBottom: 2,
                                borderBottom: '1px solid var(--border-subtle)',
                                background: isHL ? 'rgba(86,194,240,.22)' : 'transparent',
                                boxShadow: isHL ? '0 0 0 1px rgba(86,194,240,.5)' : 'none',
                                transition: 'background .4s ease, box-shadow .4s ease' }}>
                              <Icon name="file-text" size={16} color="var(--celeste-300)" />
                              <div className="ev-doc-info" style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, color: 'var(--text-strong)', fontSize: 13.5 }}>{doc.name}</div>
                                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                                  {doc.format}{doc.size ? ` · ${doc.size}` : ''} · {fmtDate(doc.created_at)}
                                </span>
                              </div>
                              <Badge tone={statusTone}>{doc.status}</Badge>
                              <div className="ev-doc-actions" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {doc.file_url && (
                                  <a href={doc.file_url} target="_blank" rel="noreferrer"
                                    style={{ color: 'var(--azul-400)', display: 'flex', alignItems: 'center', padding: 4 }}>
                                    <Icon name="external-link" size={14} />
                                  </a>
                                )}
                                {isAdmin && <button onClick={() => setModal(doc)}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4 }}>
                                  <Icon name="pencil" size={14} />
                                </button>}
                                {isAdmin && <button onClick={() => del(doc.id)}
                                  style={{ background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', padding: 4 }}>
                                  <Icon name="trash-2" size={14} />
                                </button>}
                              </div>
                            </div>
                          );
                        })
                    }
                    {isAdmin && <div style={{ marginTop: 12 }}>
                      <Button size="sm" variant="ghost" onClick={() => setModal({ objective_code: obj.code })}>
                        <Icon name="plus" size={14} /> Agregar documento aquí
                      </Button>
                    </div>}
                  </div>
                )}
              </div>
            );
          })
      }

      {/* Evidencias huérfanas (solo admin): visibles y gestionables aquí */}
      {isAdmin && orphans.length > 0 && (
        <div style={{ ...CARD, border: '1px solid rgba(252,215,126,.34)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ color: 'var(--warning-300)' }}><Icon name="alert-triangle" size={18} /></span>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text-strong)' }}>
              Sin objetivo asignado ({orphans.length})
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>
            Estas evidencias quedaron huérfanas (su objetivo fue borrado o le cambiaron el código). Reasígnalas a un objetivo o elimínalas.
          </p>
          {orphans.map(doc => {
            const statusTone = doc.status === 'Aprobado' ? 'ok' : doc.status === 'Rechazado' ? 'risk' : 'warn';
            return (
              <div key={doc.id} className="ev-doc-row"
                style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <Icon name="file-text" size={16} color="var(--celeste-300)" />
                <div className="ev-doc-info" style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-strong)', fontSize: 13.5 }}>{doc.name}</div>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {doc.format}{doc.size ? ` · ${doc.size}` : ''} · {fmtDate(doc.created_at)}
                    {doc.objective_code ? ` · código: ${doc.objective_code}` : ' · sin código'}
                  </span>
                </div>
                <Badge tone={statusTone}>{doc.status}</Badge>
                <div className="ev-doc-actions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <select defaultValue="" onChange={e => { if (e.target.value) reassign(doc.id, e.target.value); }}
                    style={{ fontSize: 11, padding: '4px 8px', maxWidth: 200 }}>
                    <option value="">Reasignar a…</option>
                    {objectives.map(o => <option key={o.id} value={o.code}>{o.code} — {o.name}</option>)}
                  </select>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer"
                      style={{ color: 'var(--azul-400)', display: 'flex', alignItems: 'center', padding: 4 }}>
                      <Icon name="external-link" size={14} />
                    </a>
                  )}
                  <button onClick={() => del(doc.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', padding: 4 }}>
                    <Icon name="trash-2" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <EvModal
          initial={modal === 'new' ? null : (modal?.id ? modal : { objective_code: modal?.objective_code || '' })}
          objectives={objectives}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function EvModal({ initial, objectives, onClose, onSave }) {
  const [f, setF] = useState({
    objective_code: initial?.objective_code || objectives[0]?.code || '',
    name: initial?.name || '', format: initial?.format || 'PDF',
    status: initial?.status || 'Pendiente',
    file_url: initial?.file_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState('');
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Solo se permiten enlaces http/https (evita esquemas peligrosos como javascript:).
  const isValidUrl = (u) => {
    if (!u) return true;
    try { const p = new URL(u); return p.protocol === 'http:' || p.protocol === 'https:'; }
    catch { return false; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidUrl(f.file_url)) { setUrlError('La URL debe empezar con http:// o https://'); return; }
    setUrlError('');
    setSaving(true); await onSave(f); setSaving(false);
  };

  return (
    <Modal title={initial?.id ? 'Editar evidencia' : 'Nueva evidencia'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Objetivo COMGES">
          <select value={f.objective_code} onChange={e => s('objective_code', e.target.value)}>
            {objectives.map(o => <option key={o.id} value={o.code}>{o.code} — {o.name}</option>)}
          </select>
        </Field>
        <Field label="Nombre del documento">
          <input value={f.name} onChange={e => s('name', e.target.value)} placeholder="Ej: Política de ciberseguridad 2026" required />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Formato">
            <select value={f.format} onChange={e => s('format', e.target.value)}>
              {['PDF','DOCX','XLSX','PPT','ZIP','IMG','Otro'].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select value={f.status} onChange={e => s('status', e.target.value)}>
              {['Pendiente','En revisión','Aprobado','Rechazado'].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <Field label="URL del archivo (opcional)">
          <input type="url" value={f.file_url} onChange={e => { s('file_url', e.target.value); if (urlError) setUrlError(''); }} placeholder="https://drive.google.com/…" />
          {urlError && <p style={{ color: 'var(--danger-300)', fontSize: 12, marginTop: 6 }}>{urlError}</p>}
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : initial?.id ? 'Actualizar' : 'Guardar evidencia'}</Button>
        </div>
      </form>
    </Modal>
  );
}
