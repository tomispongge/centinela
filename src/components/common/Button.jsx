// Botón — portado de Btn() del HTML original.
// variant: primary | ghost | danger | success · size: sm | md | lg
export default function Button({
  children, onClick, variant = 'primary', size = 'md',
  type = 'button', disabled = false, full = false, style: sx = {},
}) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 7, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'Manrope, sans-serif',
    fontWeight: 600, transition: 'all 150ms', opacity: disabled ? 0.55 : 1,
    width: full ? '100%' : undefined, justifyContent: full ? 'center' : undefined,
  };
  const SZ = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '10px 18px', fontSize: 14 },
    lg: { padding: '13px 24px', fontSize: 15 },
  };
  const VA = {
    primary: { background: 'linear-gradient(135deg,var(--azul-500),var(--morado-500))', color: '#fff', boxShadow: 'var(--glow-azul)' },
    ghost:   { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-default)' },
    danger:  { background: 'rgba(242,86,111,.16)', color: 'var(--danger-300)', border: '1px solid rgba(252,165,184,.32)' },
    success: { background: 'rgba(16,185,129,.16)', color: 'var(--success-300)', border: '1px solid rgba(110,231,183,.32)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...SZ[size], ...VA[variant], ...sx }}>
      {children}
    </button>
  );
}
