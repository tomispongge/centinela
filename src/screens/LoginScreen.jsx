import { useState } from 'react';
import { sb } from '../lib/supabase';
import { CARD } from '../lib/constants';
import Field from '../components/common/Field';
import Button from '../components/common/Button';
import CsShieldLogo from '../components/common/CsShieldLogo';

// ════════════════════════════════════════════════════
// LoginScreen — inicio de sesión con email + contraseña.
// Portado del HTML original. onLogin(user) al autenticar.
// ════════════════════════════════════════════════════
export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error: err } = await sb.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onLogin(data.user);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%' }}>
      <div className="anim-fade" style={{ ...CARD, width: 420, padding: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <CsShieldLogo size={60} gradId="login-shield" />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--text-strong)' }}>
              Cyber-Sentinel
            </h1>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-faint)', marginTop: 5, letterSpacing: '0.12em' }}>
              COMGES · SALUD · CUMPLIMIENTO
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Correo electrónico">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@organismo.cl" required autoComplete="email" />
          </Field>
          <Field label="Contraseña">
            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password" />
          </Field>
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(242,86,111,.12)',
              border: '1px solid rgba(252,165,184,.3)', borderRadius: 'var(--radius-md)',
              color: 'var(--danger-300)', fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} full style={{ marginTop: 8 }}>
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>
      </div>
    </div>
  );
}
