// Field — label en mayúsculas + children (input/select/textarea).
// Portado de Field() del HTML original.
export default function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--text-faint)',
        textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
