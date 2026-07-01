import { useState, useEffect, lazy, Suspense } from 'react';
import { sb, NOT_CONFIGURED } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { useMembership } from './hooks/useMembership';
import { useAutoLogout } from './hooks/useAutoLogout';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Spinner from './components/common/Spinner';
import SetupScreen from './screens/SetupScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import SelectionScreen from './screens/SelectionScreen';
import IsoPendingScreen from './screens/IsoPendingScreen';
import NoOrgScreen from './screens/NoOrgScreen';
import DashboardScreen from './screens/DashboardScreen';
import ObjectivesScreen from './screens/ObjectivesScreen';
import IncidentsScreen from './screens/IncidentsScreen';
import EvidenceScreen from './screens/EvidenceScreen';
import OrgScreen from './screens/OrgScreen';
import UsersScreen from './screens/UsersScreen';
// Carga diferida: react-markdown solo se descarga al abrir Informes.
const ReportsScreen = lazy(() => import('./screens/ReportsScreen'));

// ════════════════════════════════════════════════════
// App — shell y máquina de estados. Portado del App original.
// El orden de las guardas de render es el mismo que en el HTML original.
// ════════════════════════════════════════════════════
const SCREENS = {
  dashboard:  { title: 'Panel de control',            comp: DashboardScreen },
  objectives: { title: 'Objetivos COMGES',            comp: ObjectivesScreen },
  incidents:  { title: 'Incidentes de seguridad',     comp: IncidentsScreen },
  evidence:   { title: 'Evidencias de cumplimiento',  comp: EvidenceScreen },
  reports:    { title: 'Informes',                    comp: ReportsScreen },
  org:        { title: 'Configuración del organismo', comp: OrgScreen },
  users:      { title: 'Usuarios y accesos',          comp: UsersScreen },
};

export default function App() {
  const { user, setUser, loading, signOut } = useAuth();
  const { membership, loading: memLoading } = useMembership(user);

  // Cierre de sesión tras 1 hora de inactividad (solo si hay usuario).
  useAutoLogout(!!user, signOut);

  const [framework, setFramework]   = useState(null); // null | 'comges' | 'iso'
  const [current, setCurrent]       = useState('dashboard');
  const [openInc, setOpenInc]       = useState(0);
  const [isMobile, setIsMobile]     = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [highlightEvidence, setHighlightEvidence] = useState(null); // id de evidencia a resaltar al navegar
  const [inviteToken] = useState(() => {               // token de invitación en la URL (?token=)
    try { return new URLSearchParams(window.location.search).get('token'); } catch (e) { return null; }
  });

  // Detectar viewport
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setDrawerOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Badge de incidentes abiertos en el sidebar (solo COMGES)
  useEffect(() => {
    if (!user || framework !== 'comges' || !membership) return;
    (async () => {
      const { count } = await sb.from('incidents').select('id', { count: 'exact', head: true })
        .eq('org_id', membership.org_id).neq('status', 'Resuelto');
      setOpenInc(count || 0);
    })();
  }, [user, current, framework, membership]);

  // Navegación que limpia el resaltado salvo cuando vamos explícitamente a Evidencias
  const navigate = (key) => { if (key !== 'evidence') setHighlightEvidence(null); setCurrent(key); };

  if (loading) return <Spinner full />;
  if (NOT_CONFIGURED) return <SetupScreen />;
  if (inviteToken && !user) return <RegisterScreen token={inviteToken} />;
  if (!user) return <LoginScreen onLogin={setUser} />;

  // Pantalla de selección de marco
  if (!framework) {
    return (
      <SelectionScreen
        user={user}
        onSelect={(fw) => { setFramework(fw); setCurrent('dashboard'); }}
        onLogout={signOut}
      />
    );
  }

  // ISO: pantalla pendiente (con sidebar reducido para poder volver)
  if (framework === 'iso') {
    return (
      <div style={{ display: 'flex', height: '100%', width: '100%' }}>
        <Sidebar
          current="iso"
          onNavigate={() => {}}
          user={user}
          openIncidents={0}
          onLogout={signOut}
          onChangeFramework={() => { setFramework(null); setDrawerOpen(false); }}
          isMobile={isMobile}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Topbar title="ISO 27001" isMobile={isMobile} onMenuToggle={() => setDrawerOpen(true)} />
          <div style={{ flex: 1, padding: isMobile ? 16 : 28, overflowY: 'auto' }}>
            <IsoPendingScreen />
          </div>
        </div>
      </div>
    );
  }

  // COMGES requiere organización: esperar la carga de membresía y validarla
  if (memLoading) return <Spinner full />;
  if (!membership) return <NoOrgScreen email={user.email} onLogout={signOut} />;

  // COMGES: app completa
  const { title, comp: Screen } = SCREENS[current] || SCREENS.dashboard;

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <Sidebar
        current={current}
        onNavigate={navigate}
        user={user}
        role={membership.role}
        openIncidents={openInc}
        onLogout={signOut}
        onChangeFramework={() => { setFramework(null); setDrawerOpen(false); }}
        isMobile={isMobile}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar title={title} isMobile={isMobile} onMenuToggle={() => setDrawerOpen(true)} />
        <div style={{ flex: 1, padding: isMobile ? 16 : 28, overflowY: 'auto' }}>
          <Suspense fallback={<Spinner full />}>
            <Screen
              userId={user.id}
              orgId={membership.org_id}
              role={membership.role}
              onNavigate={navigate}
              highlightEvidence={highlightEvidence}
              onHighlightEvidence={setHighlightEvidence}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
