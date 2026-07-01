# Brief de migración — Cyber-Sentinel → React 18 + Vite

> **Cómo usar este documento:** pegarlo al inicio de la sesión de Claude Code para darle contexto completo.
> Trabajar en la rama `migracion-vite`. La rama `main` debe quedar **intacta** y seguir desplegando la versión estable en Vercel.

---

## 1. Qué es el proyecto
Cyber-Sentinel es una app de gestión de cumplimiento en ciberseguridad para instituciones de salud / sector público en Chile (seguimiento de ejes **COMGES** e **ISO 27001**). Es **multi-organización** con roles **admin** y **member**, backend en **Supabase** (auth + Postgres + RLS), desplegada con **GitHub + Vercel**.

**Estado actual:** un único archivo HTML (~2.249 líneas) que usa React 18 vía **Babel standalone** (compila JSX en el navegador), Supabase JS y lucide (UMD). Está **en producción y funcionando** — es el archivo HTML que está en el repo (el que sirve Vercel). Ese archivo es la **fuente de verdad** para portar componentes, pantallas y lógica: ante la duda, replicar su comportamiento exacto.

---

## 2. Objetivo y restricciones DURAS
Migrar de monolito + Babel-standalone a **React 18 + Vite modular**, sin romper nada.

**No cambiar:**
- La **UI** ni la **UX** — mismo diseño visual exacto. Paleta navy oscuro `#060F2B` + cian `#66D4F7`, glass-morphism, tipografías Space Grotesk / Manrope / JetBrains Mono. Portar los design tokens (las variables `:root`) tal cual.
- La **lógica de negocio** — pantallas, flujos, cálculos COMGES (ponderaciones de ejes 20/20/20/20/10/10, gauges del dashboard), gating por rol.
- El **backend**: esquema, políticas RLS y funciones de Supabase (`redeem_invite`, `is_org_admin`, `is_org_member`, `validate_invite`, `list_org_members`). **No tocar la base de datos.**
- El **flujo de auth**: registro **solo por invitación** (no hay auto-registro), redención vía `redeem_invite`, aislamiento por organización.

---

## 3. Estado de seguridad (importante)
- **Ya aplicado — NO revertir:** se hizo `revoke execute` sobre `set_member` y `remove_member` para `anon`/`authenticated` (eran un hueco de escalación de privilegios). La app no las llama; son herramientas de consola.
- **La autorización real vive en la RLS** (escritura admin-only por organización). Los chequeos `isAdmin` / `role === 'admin'` del cliente son **solo de UI** (ocultan botones) — la base es la que enforcea de verdad. Mantenerlos tal cual: no son la barrera de seguridad, pero sí parte de la UX.
- **Hardening pendiente** (hacer durante/después de la migración, no bloquea):
  - Mover `SUPABASE_URL` y `SUPABASE_ANON_KEY` (hoy hardcodeadas en el HTML) a variables de entorno `VITE_`. La anon key es pública por diseño, pero conviene sacarla del código y dejarla en `.env` (gitignored) + en Vercel.
  - `vercel.json` con cabeceras de seguridad y **CSP** — ahora es viable una CSP estricta porque, al eliminar Babel, ya no se necesita `unsafe-eval`.
  - Validar el esquema de `file_url` (solo `http`/`https`) en el cliente, además de un `CHECK` en la columna.
  - Scaffolding de **MFA** (TOTP de Supabase), al menos para admins.
  - La migración en sí ya resuelve los builds de desarrollo de React y la fragilidad de Babel.

---

## 4. Stack objetivo
- **React 18 + Vite**
- `@supabase/supabase-js` v2 como **singleton** (un solo `createClient`, exportado desde un módulo; nunca instanciar más de una vez).
- Variables de entorno con prefijo **`VITE_`** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). `.env` en `.gitignore`; setear los valores en Vercel (Project Settings → Environment Variables).
- **`lucide-react`** (paquete React) en vez del global UMD de lucide.
- TypeScript: **opcional**, mejor en una segunda pasada para no sumar riesgo a la migración. Empezar en JSX plano.

---

## 5. Estructura de directorios propuesta
```
index.html                 # shell mínimo de Vite (<div id="root">)
vite.config.js
package.json
.env                       # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (gitignored)
vercel.json                # rewrites SPA + cabeceras de seguridad + CSP
src/
  main.jsx                 # entry: ReactDOM.createRoot
  App.jsx                  # shell: estado de auth + ruteo de pantallas
  lib/
    supabase.js            # createClient singleton (export const sb)
  styles/
    tokens.css             # las variables :root del HTML actual
    global.css             # estilos base (body, inputs, scrollbar, .modal-overlay…)
  components/
    common/                # Button, Badge, Card, Modal, ProgressRing, etc.
    layout/                # Sidebar, Topbar
  screens/
    LoginScreen.jsx
    RegisterScreen.jsx     # redención de invitación (validate_invite + redeem_invite)
    DashboardScreen.jsx    # gauges de cumplimiento
    ObjectivesScreen.jsx
    IncidentsScreen.jsx
    EvidenceScreen.jsx
    OrgScreen.jsx
    UsersScreen.jsx        # solo admin (list_org_members)
  hooks/
    useAuth.js             # sesión, signOut, onAuthStateChange
    useMembership.js       # org_id + role del usuario
  services/
    objectives.js, tasks.js, incidents.js, evidence.js, invites.js
```
*(Los nombres de pantallas salen de la app actual; mapearlos a las pantallas reales del HTML.)*

---

## 6. Plan por fases (verificar cada una antes de seguir)
0. **Scaffold**: `npm create vite@latest` (React, JS). Instalar `react react-dom @supabase/supabase-js lucide-react`. Dejar corriendo una app Vite en blanco con `npm run dev`.
1. **Estilos**: portar tokens (`:root`) a `styles/tokens.css` y los estilos base a `styles/global.css`. Armar el `index.html` mínimo.
2. **Supabase + auth**: `lib/supabase.js` (singleton con env `VITE_`). `useAuth` (login con `signInWithPassword`, sesión, `signOut`) y la redención de invitación.
3. **Pantallas**: extraer del HTML una por una hacia `src/screens`, sacando componentes compartidos a `components/common` sobre la marcha. Verificar que cada pantalla renderiza y funciona contra el Supabase real (es el mismo backend) antes de pasar a la siguiente.
4. **Servicios**: mover las queries inline `sb.from(...)` a módulos en `services/`.
5. **Robustez**: error boundary, `vercel.json` (rewrites SPA + cabeceras + CSP), validación de `file_url`.
6. **Deploy**: configurar el build de Vite en Vercel para la rama (preset Vite: build `npm run build`, output `dist`); probar el preview deploy. **Antes de mergear a `main`**, cambiar el build setting del proyecto en Vercel al preset Vite — hoy el proyecto sirve HTML sin build, así que ese cambio es necesario para que producción no se rompa al mergear. Mergear recién cuando esté verificado.

---

## 7. Gotchas
- **Singleton de Supabase**: instanciar `createClient` una sola vez y exportarlo; múltiples instancias rompen la sesión/realtime.
- **`VITE_` obligatorio**: variables sin ese prefijo no se exponen al cliente.
- **`.env` a `.gitignore`** y valores en Vercel; nunca commitear `.env`.
- **Babel fuera**: el problema de fallos silenciosos por errores de sintaxis JSX desaparece — Vite/ESLint los detecta en compilación, no en producción (pantalla en blanco).
- **CSP sin `unsafe-eval`**: posible justamente porque ya no hay Babel en runtime.
- **Portar fiel**: el HTML actual es la referencia de UI, UX y lógica. La migración es reorganizar, no rediseñar.
