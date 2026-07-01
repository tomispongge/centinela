import Icon from '../common/Icon';
import CsShieldLogo from '../common/CsShieldLogo';

// ════════════════════════════════════════════════════
// Sidebar — navegación principal. Portado del HTML original.
// · El link "Usuarios" solo aparece si role === 'admin' (gating de UI).
// · En móvil se comporta como drawer (position fixed + overlay).
// ════════════════════════════════════════════════════
export default function Sidebar({
  current, onNavigate, user, role, openIncidents,
  onLogout, onChangeFramework, isMobile, isOpen, onClose,
}) {
  const NAV = [
    { key: 'dashboard',  icon: 'layout-dashboard', label: 'Panel' },
    { key: 'objectives', icon: 'target',           label: 'Objetivos COMGES' },
    { key: 'incidents',  icon: 'shield-alert',      label: 'Incidentes',  badge: openIncidents || null },
    { key: 'evidence',   icon: 'file-check-2',      label: 'Evidencias' },
    { key: 'reports',    icon: 'file-text',         label: 'Informes' },
    { key: 'org',        icon: 'building-2',         label: 'Organismo' },
    ...(role === 'admin' ? [{ key: 'users', icon: 'users', label: 'Usuarios' }] : []),
  ];
  const initials = user?.email?.[0]?.toUpperCase() || 'U';

  const handleNav = (key) => { onNavigate(key); if (isMobile && onClose) onClose(); };

  const asideStyle = isMobile
    ? { position: 'fixed', top: 0, left: 0, height: '100vh', width: 'min(80vw, 280px)',
        zIndex: 1001, transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 240ms ease', display: 'flex', flexDirection: 'column',
        padding: '20px 16px', gap: 16, background: 'rgba(6,15,43,.96)',
        borderRight: '1px solid var(--border-subtle)', backdropFilter: 'var(--blur-glass)', overflowY: 'auto' }
    : { width: 264, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column',
        padding: '20px 16px', gap: 20, background: 'rgba(6,15,43,.55)',
        borderRight: '1px solid var(--border-subtle)', backdropFilter: 'var(--blur-glass)' };

  return (
    <>
      {isMobile && isOpen && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(3,8,22,.6)', backdropFilter: 'blur(3px)' }} />
      )}
      <aside style={asideStyle}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px' }}>
          <CsShieldLogo size={32} gradId="sb-shield" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text-strong)' }}>
              Cyber-Sentinel
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: 'var(--text-faint)' }}>
              COMGES · SALUD
            </div>
          </div>
          {isMobile && (
            <button onClick={onClose} aria-label="Cerrar menú"
              style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer',
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={20} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV.map(it => {
            const active = current === it.key;
            return (
              <button key={it.key} onClick={() => handleNav(it.key)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '11px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: active ? 'linear-gradient(100deg,rgba(124,92,252,.22),rgba(42,111,219,.16))' : 'transparent',
                border: active ? '1px solid var(--border-default)' : '1px solid transparent',
                color: active ? 'var(--text-strong)' : 'var(--text-muted)',
                fontSize: 14, fontWeight: 600, transition: 'all 140ms',
              }}>
                <span style={{ color: active ? 'var(--celeste-300)' : 'inherit' }}><Icon name={it.icon} /></span>
                <span style={{ flex: 1, textAlign: 'left' }}>{it.label}</span>
                {it.badge > 0 && (
                  <span style={{ minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: '#fff',
                    background: 'var(--morado-500)', borderRadius: 'var(--radius-pill)' }}>
                    {it.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Cambiar marco */}
        <button onClick={onChangeFramework} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '10px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          background: 'transparent', border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, transition: 'all 140ms' }}>
          <Icon name="layout-grid" size={16} />
          <span style={{ flex: 1, textAlign: 'left' }}>Cambiar marco</span>
        </button>

        {/* User footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12,
          background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'var(--grad-shield)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>Encargado COMGES</div>
          </div>
          <button onClick={onLogout} title="Cerrar sesión"
            style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4 }}>
            <Icon name="log-out" size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
