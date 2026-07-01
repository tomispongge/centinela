import Icon from '../components/common/Icon';

// IsoPendingScreen — placeholder del módulo ISO 27001 (en desarrollo).
// Portado del HTML original.
export default function IsoPendingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', minHeight: '60vh', gap: 18, padding: 20 }}>
      <div style={{ width: 88, height: 88, borderRadius: 'var(--radius-lg)',
        background: 'var(--grad-shield)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', boxShadow: 'var(--shadow-md)' }}>
        <Icon name="globe" size={44} />
      </div>
      <div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--text-strong)' }}>
          ISO 27001
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 10, maxWidth: 440 }}>
          El módulo de cumplimiento ISO/IEC 27001 está en desarrollo. Pronto podrás gestionar tus
          controles del SGSI desde aquí.
        </p>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--warning-300)',
        background: 'rgba(244,183,64,.14)', border: '1px solid rgba(252,215,126,.3)',
        borderRadius: 'var(--radius-pill)', padding: '5px 13px' }}>
        Próximamente
      </span>
    </div>
  );
}
