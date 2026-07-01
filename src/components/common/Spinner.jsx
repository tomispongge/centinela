// Spinner — anillo girando. `full` lo centra en todo el alto disponible.
// Portado de Spinner() del HTML original.
export default function Spinner({ full = false }) {
  const el = (
    <div style={{ width: 32, height: 32, border: '3px solid var(--border-subtle)',
      borderTop: '3px solid var(--azul-400)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  );
  if (!full) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>{el}</div>;
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>{el}</div>;
}
