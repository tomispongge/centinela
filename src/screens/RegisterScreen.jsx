import { useState, useEffect } from 'react';
import { sb } from '../lib/supabase';
import { CARD } from '../lib/constants';
import Field from '../components/common/Field';
import Button from '../components/common/Button';
import Icon from '../components/common/Icon';
import CsShieldLogo from '../components/common/CsShieldLogo';

// ════════════════════════════════════════════════════
// RegisterScreen — registro por invitación (token en la URL).
// Valida el token con validate_invite y crea la cuenta con signUp,
// pasando el invite_token en la metadata para canjearlo tras confirmar.
// Portado de RegistroScreen() del HTML original.
// ════════════════════════════════════════════════════
export default function RegisterScreen({ token }) {
  const [state, setState]   = useState('loading'); // loading | invalid | form | done
  const [invite, setInvite] = useState(null);      // { email, role, org_name, valid }
  const [pwd, setPwd]       = useState('');
  const [pwd2, setPwd2]     = useState('');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sb.rpc('validate_invite', { p_token: token }).then(({ data, error }) => {
      const inv = Array.isArray(data) ? data[0] : data;
      if (error || !inv || !inv.valid) setState('invalid');
      else { setInvite(inv); setState('form'); }
    });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (pwd.length < 8)  { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (pwd !== pwd2)    { setError('Las contraseñas no coinciden.'); return; }
    setSaving(true);
    const { error: err } = await sb.auth.signUp({
      email: invite.email, password: pwd,
      options: { data: { invite_token: token }, emailRedirectTo: window.location.origin },
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setState('done');
  };

  const goLogin = () => { window.location.href = window.location.origin; };

  return (
    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
      <div className="anim-fade" style={{ ...CARD, width: 440, padding: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <CsShieldLogo size={56} gradId="reg-shield" />
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text-strong)', textAlign: 'center' }}>
            Crear cuenta
          </h1>
        </div>

        {state === 'loading' && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Validando invitación…</p>}

        {state === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-body)', fontSize: 14, marginBottom: 18 }}>
              Esta invitación no es válida, ya fue utilizada o expiró. Pídele a un administrador que te envíe una nueva.
            </p>
            <Button variant="ghost" onClick={goLogin}>Ir al inicio de sesión</Button>
          </div>
        )}

        {state === 'form' && invite && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 2 }}>
              Te invitaron a <strong style={{ color: 'var(--text-strong)' }}>{invite.org_name}</strong> como <strong style={{ color: 'var(--celeste-300)' }}>{invite.role === 'admin' ? 'administrador' : 'miembro'}</strong>.
            </p>
            <Field label="Correo electrónico">
              <input type="email" value={invite.email} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
            </Field>
            <Field label="Contraseña (mínimo 8 caracteres)">
              <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" autoFocus />
            </Field>
            <Field label="Repetir contraseña">
              <input type="password" value={pwd2} onChange={e => setPwd2(e.target.value)} placeholder="••••••••" />
            </Field>
            {error && <p style={{ color: 'var(--danger-300)', fontSize: 12.5 }}>{error}</p>}
            <Button type="submit" disabled={saving}>{saving ? 'Creando…' : 'Crear cuenta'}</Button>
          </form>
        )}

        {state === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--success-300)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <Icon name="mail-check" size={40} />
            </div>
            <p style={{ color: 'var(--text-body)', fontSize: 14, marginBottom: 18 }}>
              ¡Cuenta creada! Te enviamos un correo de confirmación a <strong>{invite.email}</strong>. Ábrelo y confirma tu cuenta para poder ingresar.
            </p>
            <Button variant="ghost" onClick={goLogin}>Ir al inicio de sesión</Button>
          </div>
        )}
      </div>
    </div>
  );
}
