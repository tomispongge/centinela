// Badge — portado de Badge() del HTML original.
// tone: ok | warn | risk | azul | morado
export default function Badge({ children, tone = 'ok', style: sx = {} }) {
  const C = {
    ok:    { bg: 'rgba(16,185,129,.16)', color: 'var(--success-300)', b: 'rgba(110,231,183,.3)' },
    warn:  { bg: 'rgba(244,183,64,.16)', color: 'var(--warning-300)', b: 'rgba(252,215,126,.3)' },
    risk:  { bg: 'rgba(242,86,111,.16)', color: 'var(--danger-300)', b: 'rgba(252,165,184,.3)' },
    azul:  { bg: 'rgba(42,111,219,.16)', color: 'var(--azul-400)', b: 'rgba(79,132,242,.3)' },
    morado:{ bg: 'rgba(124,92,252,.16)', color: 'var(--morado-300)', b: 'rgba(171,144,251,.3)' },
  };
  const c = C[tone] || C.azul;
  return (
    <span style={{ padding: '3px 9px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.b}`, whiteSpace: 'nowrap', ...sx }}>
      {children}
    </span>
  );
}
