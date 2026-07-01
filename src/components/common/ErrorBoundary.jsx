import React from 'react';
import { CARD } from '../../lib/constants';

// ════════════════════════════════════════════════════
// ErrorBoundary — atrapa errores de render y muestra un fallback amable
// en vez de la pantalla en blanco. Se mantiene sin dependencias frágiles
// (solo CARD) para que el propio fallback no pueda fallar.
// ════════════════════════════════════════════════════
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary capturó un error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', padding: 20 }}>
        <div style={{ ...CARD, maxWidth: 460, padding: 36, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 18px',
            background: 'rgba(242,86,111,.16)', border: '1px solid rgba(252,165,184,.32)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
            ⚠️
          </div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)' }}>
            Algo salió mal
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 10, marginBottom: 24 }}>
            Ocurrió un error inesperado. Recarga la página para continuar; si el problema persiste, avisa al equipo.
          </p>
          <button onClick={() => window.location.reload()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', border: 'none',
              borderRadius: 'var(--radius-md)', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 14,
              padding: '10px 18px', background: 'linear-gradient(135deg,var(--azul-500),var(--morado-500))',
              color: '#fff', boxShadow: 'var(--glow-azul)' }}>
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
