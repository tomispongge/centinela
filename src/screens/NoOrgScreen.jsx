import Icon from '../components/common/Icon';
import Button from '../components/common/Button';

// NoOrgScreen — usuario autenticado pero sin membresía a ninguna organización.
// Portado del HTML original.
export default function NoOrgScreen({ email, onLogout }) {
  return (
    <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', minHeight: '100vh', gap: 18, padding: 20 }}>
      <div style={{ width: 88, height: 88, borderRadius: 'var(--radius-lg)',
        background: 'var(--grad-shield)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', boxShadow: 'var(--shadow-md)' }}>
        <Icon name="users" size={44} />
      </div>
      <div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--text-strong)' }}>
          Sin organización asignada
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 10, maxWidth: 460 }}>
          Tu cuenta ({email}) aún no pertenece a ninguna organización. Pídele a un administrador
          que te invite o te asigne a un organismo para acceder al panel.
        </p>
      </div>
      <Button variant="ghost" onClick={onLogout}>Cerrar sesión</Button>
    </div>
  );
}
