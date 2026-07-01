import Icon from './Icon';

// EmptyState — icono tenue + mensaje. `icon` es un nombre kebab-case.
// Portado de EmptyState() del HTML original.
export default function EmptyState({ icon, msg }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      padding: '48px 20px', color: 'var(--text-faint)' }}>
      <Icon name={icon} size={36} style={{ opacity: 0.35 }} />
      <p style={{ fontSize: 14 }}>{msg}</p>
    </div>
  );
}
