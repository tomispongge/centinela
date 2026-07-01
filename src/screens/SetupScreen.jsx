import { CARD } from '../lib/constants';
import Icon from '../components/common/Icon';
import CsShieldLogo from '../components/common/CsShieldLogo';

// ════════════════════════════════════════════════════
// SetupScreen — se muestra cuando faltan las credenciales (NOT_CONFIGURED).
// Adaptado: las instrucciones ahora apuntan al archivo .env (VITE_*) en vez
// de a constantes en el HTML, porque la config cambió con la migración.
// ════════════════════════════════════════════════════
export default function SetupScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', padding: 20 }}>
      <div style={{ ...CARD, maxWidth: 580, padding: 40, textAlign: 'center' }}>
        <CsShieldLogo size={56} gradId="setup-shield" />
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text-strong)', marginTop: 16 }}>
          Configura Supabase
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginTop: 10, marginBottom: 28 }}>
          Para activar la app, define{' '}
          <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--celeste-300)', fontSize: 12 }}>VITE_SUPABASE_URL</code> y{' '}
          <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--celeste-300)', fontSize: 12 }}>VITE_SUPABASE_ANON_KEY</code>{' '}
          en el archivo <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--celeste-300)', fontSize: 12 }}>.env</code> con las credenciales de tu proyecto.
        </p>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            ['1', 'folder-open', 'Crea un proyecto en supabase.com (gratis)'],
            ['2', 'database', 'Ve a SQL Editor y ejecuta el schema del proyecto'],
            ['3', 'key', 'Copia URL y anon key desde Project Settings → API'],
            ['4', 'code', 'Pégalos en .env como VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'],
            ['5', 'user-plus', 'Crea usuarios en Authentication → Users'],
          ].map(([n, icon, text]) => (
            <div key={n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--grad-shield)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff' }}>{n}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                <span style={{ color: 'var(--celeste-300)' }}><Icon name={icon} size={16} /></span>
                <span style={{ fontSize: 13.5, color: 'var(--text-body)' }}>{text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
