import { useState, useEffect } from 'react';
import { sb } from '../lib/supabase';
import { CARD, getTone, TONE_COLOR, TONE_GRAD, TONE_STROKE } from '../lib/constants';
import { globalCompliance, realCompliance } from '../lib/compliance';
import Icon from '../components/common/Icon';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';

// ════════════════════════════════════════════════════
// DashboardScreen — dos gauges (global + real), grid de stats,
// avance por objetivo e incidentes recientes. Portado del HTML original.
// La ponderación vive en lib/compliance.js (aislada para la Fase 7).
// ════════════════════════════════════════════════════
export default function DashboardScreen({ orgId }) {
  const [data, setData]       = useState({ objectives: [], incidents: [], evidence: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const [{ data: objs }, { data: inc }, { data: ev }] = await Promise.all([
        sb.from('objectives').select('id, code, name, tasks(id,done)').eq('org_id', orgId),
        sb.from('incidents').select('id,title,incident_number,severity,sev_label,status,incident_date').eq('org_id', orgId).order('incident_date', { ascending: false }),
        sb.from('evidence').select('id').eq('org_id', orgId),
      ]);
      setData({ objectives: objs || [], incidents: inc || [], evidence: ev || [] });
      setLoading(false);
    })();
  }, [orgId]);

  if (loading) return <Spinner />;

  const enriched = data.objectives.map(o => {
    const total = o.tasks?.length || 0;
    const done  = o.tasks?.filter(t => t.done).length || 0;
    const progress = total > 0 ? Math.round(done / total * 100) : 0;
    const isComplete = total > 0 && done === total;
    return { ...o, progress, tone: getTone(progress), isComplete };
  });

  const globalPct = globalCompliance(enriched);
  const realPct   = realCompliance(enriched);

  const openInc     = data.incidents.filter(i => i.status !== 'Resuelto').length;
  const criticalInc = data.incidents.filter(i => i.severity === 'risk' && i.status !== 'Resuelto').length;

  const C = 2 * Math.PI * 70;
  const dashGlobal = C * globalPct / 100;
  const dashReal   = C * realPct / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Row 1 - Two Compliance Rings */}
      <div className="dash-row" style={{ display: 'flex', gap: 18 }}>
        {/* Compliance ring - Global */}
        <div className="dash-ring-card" style={{ ...CARD, flex: 1, display: 'flex', alignItems: 'center', gap: 26, minWidth: 380, boxShadow: 'var(--glow-azul)' }}>
          <svg style={{ width: 140, height: 140, flexShrink: 0 }} viewBox="0 0 150 150" fill="none">
            <defs>
              <linearGradient id="dash-ring-grad-global" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#66D4F7"/><stop offset="0.5" stopColor="#2A6FDB"/><stop offset="1" stopColor="#7C5CFC"/>
              </linearGradient>
            </defs>
            <circle cx="75" cy="75" r="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
            <circle cx="75" cy="75" r="70" fill="none" stroke="url(#dash-ring-grad-global)" strokeWidth="10"
              strokeDasharray={`${dashGlobal} ${C - dashGlobal}`} strokeLinecap="round"
              filter="drop-shadow(0 0 6px rgba(86,194,240,.55))"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '75px 75px' }}/>
            <text x="75" y="75" textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 32, fill: 'var(--text-strong)' }}>
              {globalPct}%
            </text>
          </svg>
          <div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--celeste-300)' }}>
              Cumplimiento global
            </span>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--text-strong)', margin: '6px 0' }}>
              Promedio COMGES
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>
              Promedio de tareas: {globalPct}%
            </p>
          </div>
        </div>

        {/* Compliance ring - Real */}
        <div className="dash-ring-card" style={{ ...CARD, flex: 1, display: 'flex', alignItems: 'center', gap: 26, minWidth: 380, boxShadow: 'var(--glow-azul)' }}>
          <svg style={{ width: 140, height: 140, flexShrink: 0 }} viewBox="0 0 150 150" fill="none">
            <defs>
              <linearGradient id="dash-ring-grad-real" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#66D4F7"/><stop offset="0.5" stopColor="#2A6FDB"/><stop offset="1" stopColor="#7C5CFC"/>
              </linearGradient>
            </defs>
            <circle cx="75" cy="75" r="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
            <circle cx="75" cy="75" r="70" fill="none" stroke="url(#dash-ring-grad-real)" strokeWidth="10"
              strokeDasharray={`${dashReal} ${C - dashReal}`} strokeLinecap="round"
              filter="drop-shadow(0 0 6px rgba(102,212,247,.55))"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '75px 75px' }}/>
            <text x="75" y="75" textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 32, fill: 'var(--text-strong)' }}>
              {realPct}%
            </text>
          </svg>
          <div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--celeste-300)' }}>
              Cumplimiento real
            </span>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--text-strong)', margin: '6px 0' }}>
              Por objetivos completados
            </h3>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
              Ejes 1-4: 20% · Ejes 5-6: 10%
            </p>
          </div>
        </div>
      </div>

      {/* Row 2 - Stat grid */}
      <div style={{ display: 'flex', gap: 18 }}>
        <div className="dash-stat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, width: '100%' }}>
          {[
            { icon: 'target',         color: 'var(--celeste-300)', val: enriched.length,      label: 'Objetivos COMGES' },
            { icon: 'shield-alert',   color: 'var(--danger-300)',  val: openInc,              label: 'Incidentes abiertos' },
            { icon: 'alert-triangle', color: 'var(--warning-300)', val: criticalInc,          label: 'Incidentes críticos' },
            { icon: 'file-check-2',   color: 'var(--success-300)', val: data.evidence.length, label: 'Evidencias cargadas' },
          ].map(({ icon, color, val, label }) => (
            <div key={label} style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color }}><Icon name={icon} /></span>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 30, color: 'var(--text-strong)' }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3 - Progress + incidents */}
      <div className="dash-row" style={{ display: 'flex', gap: 18 }}>
        {/* Progress bars */}
        <div style={{ ...CARD, flex: 1.4 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 18 }}>
            Avance por objetivo
          </h3>
          {enriched.length === 0
            ? <EmptyState icon="target" msg="Agrega objetivos COMGES para ver el progreso" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {enriched.map(o => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: 'var(--text-faint)', width: 82, flexShrink: 0 }}>{o.code}</span>
                    <div style={{ flex: 1, height: 7, background: 'rgba(6,15,43,.6)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: o.progress + '%', background: TONE_GRAD[o.tone], borderRadius: 'var(--radius-pill)', transition: 'width 400ms' }} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13, width: 36, textAlign: 'right', flexShrink: 0, color: TONE_STROKE[o.tone] }}>
                      {o.progress}%
                    </span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Recent incidents */}
        <div style={{ ...CARD, flex: 1 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)', marginBottom: 18 }}>
            Incidentes recientes
          </h3>
          {data.incidents.length === 0
            ? <EmptyState icon="shield-check" msg="Sin incidentes registrados" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {data.incidents.slice(0, 5).map((i, idx) => (
                  <div key={i.id} style={{ display: 'flex', gap: 12, padding: '10px 0',
                    borderBottom: idx < Math.min(data.incidents.length, 5) - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: TONE_COLOR[i.severity] }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.3 }}>{i.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{i.incident_number} · {i.status}</div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}
