import Icon from '../common/Icon';

// ════════════════════════════════════════════════════
// Topbar — título de la pantalla actual + botón de menú en móvil +
// chip "Sistema operativo" en desktop. Portado del HTML original.
// ════════════════════════════════════════════════════
export default function Topbar({ title, onMenuToggle, isMobile }) {
  return (
    <header style={{ height: isMobile ? 58 : 72, flexShrink: 0, display: 'flex', alignItems: 'center',
      gap: isMobile ? 10 : 16, padding: isMobile ? '0 16px' : '0 28px',
      borderBottom: '1px solid var(--border-subtle)' }}>
      {isMobile && (
        <button onClick={onMenuToggle} aria-label="Abrir menú"
          style={{ background: 'none', border: 'none', color: 'var(--text-strong)', cursor: 'pointer',
            width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
          <Icon name="menu" size={24} />
        </button>
      )}
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600,
        fontSize: isMobile ? 18 : 24, color: 'var(--text-strong)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </h2>
      <div style={{ flex: 1 }} />
      {!isMobile && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 11px',
          background: 'rgba(16,185,129,.16)', border: '1px solid rgba(110,231,183,.32)',
          borderRadius: 'var(--radius-pill)', fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5, fontWeight: 600, color: 'var(--success-300)', textTransform: 'uppercase' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 6px currentColor' }} />
          Sistema operativo
        </span>
      )}
    </header>
  );
}
