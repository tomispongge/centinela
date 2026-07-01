import { CARD } from '../../lib/constants';
import Icon from './Icon';

// Modal — overlay + tarjeta. Cierra al hacer clic fuera o en la X.
// Portado de Modal() del HTML original.
export default function Modal({ title, onClose, children, width = 540 }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="anim-fade" style={{ ...CARD, width, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 18, color: 'var(--text-strong)' }}>{title}</h3>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4 }}>
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
