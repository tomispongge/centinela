import Icon from '../components/common/Icon';
import CsShieldLogo from '../components/common/CsShieldLogo';

// ════════════════════════════════════════════════════
// SelectionScreen — elegir marco de cumplimiento (COMGES listo · ISO próximamente).
// Portado del HTML original.
// ════════════════════════════════════════════════════
export default function SelectionScreen({ onSelect, onLogout, user }) {
  const FRAMEWORKS = [
    {
      key: 'comges', icon: 'shield-check', title: 'COMGES',
      subtitle: 'Marco ANCI · Salud',
      desc: 'Gestión de cumplimiento bajo el marco chileno de ciberseguridad para OIV de salud.',
      ready: true,
    },
    {
      key: 'iso', icon: 'globe', title: 'ISO 27001',
      subtitle: 'Estándar internacional',
      desc: 'Sistema de Gestión de Seguridad de la Información (SGSI) según ISO/IEC 27001.',
      ready: false,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 20px', overflowY: 'auto' }}>

      <div className="anim-fade" style={{ width: '100%', maxWidth: 820, display: 'flex',
        flexDirection: 'column', alignItems: 'center' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <CsShieldLogo size={56} gradId="sel-shield" />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
              fontSize: 'clamp(22px, 5vw, 30px)', color: 'var(--text-strong)' }}>
              Seleccione categorías
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, maxWidth: 480 }}>
              Elija el marco de cumplimiento con el que desea trabajar.
            </p>
          </div>
        </div>

        {/* Framework buttons */}
        <div className="sel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20, width: '100%', marginTop: 28 }}>
          {FRAMEWORKS.map(f => (
            <button key={f.key} onClick={() => onSelect(f.key)}
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', gap: 14, padding: '36px 24px', cursor: 'pointer',
                background: 'var(--surface-card)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', backdropFilter: 'var(--blur-glass)',
                color: 'var(--text-body)', transition: 'transform 160ms, border-color 160ms, box-shadow 160ms',
                minHeight: 220 }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--celeste-400)';
                e.currentTarget.style.boxShadow = 'var(--glow-azul)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'none'; }}>

              {!f.ready && (
                <span style={{ position: 'absolute', top: 14, right: 14, fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--warning-300)', background: 'rgba(244,183,64,.14)',
                  border: '1px solid rgba(252,215,126,.3)', borderRadius: 'var(--radius-pill)',
                  padding: '3px 9px' }}>
                  Próximamente
                </span>
              )}

              <div style={{ width: 76, height: 76, borderRadius: 'var(--radius-lg)',
                background: 'var(--grad-shield)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', boxShadow: 'var(--shadow-md)' }}>
                <Icon name={f.icon} size={38} />
              </div>

              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
                  fontSize: 22, color: 'var(--text-strong)' }}>
                  {f.title}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: 'var(--text-faint)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {f.subtitle}
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 280 }}>
                {f.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Logout footer */}
        <button onClick={onLogout}
          style={{ marginTop: 32, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-faint)', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Icon name="log-out" size={14} />
          Salir ({user?.email})
        </button>
      </div>
    </div>
  );
}
