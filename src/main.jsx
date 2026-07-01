import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';

// Estilos globales (orden importa: tokens antes que global).
import './styles/tokens.css';
import './styles/global.css';

// StrictMode ACTIVADO: estresa los efectos en desarrollo para cazar bugs.
// El único efecto con "escritura al montar" (redeem_invite) está blindado en
// useMembership con una promesa compartida por token → un solo canje.
// El resto son suscripciones con limpieza o lecturas idempotentes.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
