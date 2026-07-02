import Icon from '../components/common/Icon';
import Button from '../components/common/Button';

// SuspendedScreen — se muestra a los usuarios de un organismo pausado por el master.
export default function SuspendedScreen({ email, onLogout }) {
  return (
    <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', minHeight: '100vh', gap: 18, padding: 20 }}>
      <div style={{ width: 88, height: 88, borderRadius: 'var(--radius-lg)',
        background: 'rgba(244,183,64,.16)', border: '1px solid rgba(252,215,126,.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-300)' }}>
        <Icon name="alert-triangle" size={40} />
      </div>
      <div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--text-strong)' }}>
          Organismo pausado
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 10, maxWidth: 460 }}>
          El acceso a tu organismo ({email}) está temporalmente pausado. Contacta al administrador de la plataforma para más información.
        </p>
      </div>
      <Button variant="ghost" onClick={onLogout}>Cerrar sesión</Button>
    </div>
  );
}
