# Mapa de migración — `index.html` → React 18 + Vite

> Inventario completo del monolito actual (`index.html`, 2.249 líneas) con números de línea y destino propuesto en la estructura modular. Referencia para portar fiel.

---

## 0. Resumen ejecutivo

- **1 archivo** `index.html` con todo: `<style>` (líneas 79–197) + `<script type="text/babel">` (208–2248).
- **23 componentes React** + 1 `App` root + 7 helpers/constantes.
- **8 pantallas de negocio** + 4 pantallas de estado (Setup, Login, Selection, NoOrg, Registro, IsoPending).
- **Backend Supabase:** 8 tablas, 3 RPC llamadas desde el cliente, 5 métodos de auth.
- **Patrón de iconos hacky** (`Ic()` + lucide UMD + `setInterval`) que desaparece con `lucide-react` — toca **todos** los componentes.

---

## 1. Cabecera y estilos (`<head>`, líneas 1–198)

| Bloque | Líneas | Destino |
|---|---|---|
| Schema SQL en comentario (documentación) | 7–76 | `docs/schema.sql` (solo referencia, **no tocar la BD**) |
| Fuentes Google (Space Grotesk / Manrope / JetBrains Mono) | 77–78 | `index.html` (shell Vite) o `<link>` en `<head>` |
| Reset `*` box-sizing | 80 | `styles/global.css` |
| **`:root` design tokens** (paleta, radios, sombras, glass) | 81–100 | **`styles/tokens.css`** ← portar tal cual |
| `body`, `#root`, scrollbar, `.modal-overlay` | 101–113 | `styles/global.css` |
| `input/textarea/select` base + focus | 114–126 | `styles/global.css` |
| Keyframes `spin`, `fadeIn`, `.anim-fade` | 127–129 | `styles/global.css` |
| Media queries responsive (768/860/640/420…) | 131–196 | `styles/global.css` |

⚠️ **Gotcha responsive:** usa selectores de atributo tipo `[style*="grid-template-columns"]` (134) porque los estilos son inline. Portan tal cual a `global.css`, pero conviene migrar luego a clases reales.

---

## 2. Configuración y utilidades (líneas 208–250)

| Símbolo | Líneas | Destino | Nota de migración |
|---|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | 212–213 | `lib/supabase.js` | → `import.meta.env.VITE_*` |
| `NOT_CONFIGURED` | 219 | `lib/supabase.js` | flag de setup |
| `sb = createClient(...)` | 220 | **`lib/supabase.js`** | **singleton, export const sb** |
| `setInterval(lucide.createIcons, 250)` | 223 | **se elimina** | lucide-react no lo necesita |
| `Ic(name, style)` helper | 231–236 | **se elimina** | reemplazar por `<Icon/>` de lucide-react en cada uso |
| `CARD` (objeto estilo) | 238–242 | `styles/constants.js` o `components/common/Card` |
| `getTone`, `TONE_COLOR/GRAD/STROKE`, `SEV_LABEL` | 244–248 | `lib/constants.js` |
| `fmtDate` | 250 | `lib/format.js` |

### El patrón `Ic()` — el refactor más invasivo
Hoy cada icono es `{Ic('plus')}` que renderiza `<span><i data-lucide="plus"/></span>` y un `setInterval` global lo convierte en SVG. Con **lucide-react** cada uno pasa a ser un componente: `{Ic('plus')}` → `<Plus size={18} />`. Hay que mapear cada nombre kebab-case a su componente PascalCase. Iconos usados:
`shield`, `x`, `plus`, `pencil`, `trash-2`, `eye`, `check`, `copy`, `link`, `external-link`, `file-text`, `file-check-2`, `chevron-up/down`, `target`, `shield-alert`, `alert-triangle`, `shield-check`, `building-2`, `users`, `user-plus`, `user-minus`, `log-out`, `layout-dashboard`, `layout-grid`, `globe`, `menu`, `mail-check`, `folder-open`, `database`, `key`, `code`, `lock`.

---

## 3. Primitivos de UI → `components/common/`

| Componente | Líneas | Destino | API |
|---|---|---|---|
| `Btn` | 256–280 | `components/common/Button.jsx` | `variant` primary/ghost/danger/success · `size` sm/md/lg · `full` · `disabled` |
| `Badge` | 282–297 | `components/common/Badge.jsx` | `tone` ok/warn/risk/azul/morado |
| `Field` | 299–309 | `components/common/Field.jsx` | label + children |
| `Modal` | 311–326 | `components/common/Modal.jsx` | `title` · `onClose` · `width` · cierre por overlay |
| `EmptyState` | 328–336 | `components/common/EmptyState.jsx` | `icon` · `msg` |
| `Spinner` | 338–345 | `components/common/Spinner.jsx` | `full` |
| `CsShieldLogo` | 347–361 | `components/common/CsShieldLogo.jsx` | SVG con `gradId` único por instancia |

⚠️ **`gradId`:** cada `CsShieldLogo` recibe un `gradId` distinto (login-shield, sb-shield, sel-shield…) para no colisionar los `<linearGradient id>`. Mantener ese patrón.

---

## 4. Layout → `components/layout/`

| Componente | Líneas | Destino | Notas |
|---|---|---|---|
| `Sidebar` | 464–574 | `components/layout/Sidebar.jsx` | nav, badge incidentes, **link "Usuarios" solo si `role==='admin'`** (471), drawer móvil, footer usuario, "Cambiar marco" |
| `Topbar` | 579–609 | `components/layout/Topbar.jsx` | título, botón menú móvil, chip "Sistema operativo" |

---

## 5. Pantallas → `screens/`

### 5.1 Pantallas de estado / auth

| Componente | Líneas | Destino | Lógica clave |
|---|---|---|---|
| `SetupScreen` | 366–401 | `screens/SetupScreen.jsx` | se muestra si `NOT_CONFIGURED` |
| `LoginScreen` | 406–459 | `screens/LoginScreen.jsx` | `sb.auth.signInWithPassword` (415) |
| `SelectionScreen` | 614–713 | `screens/SelectionScreen.jsx` | elegir marco COMGES (listo) / ISO (próximamente) |
| `IsoPendingScreen` | 1781–1807 | `screens/IsoPendingScreen.jsx` | placeholder ISO 27001 |
| `NoOrgScreen` | 1812–1833 | `screens/NoOrgScreen.jsx` | usuario sin membresía |
| `RegistroScreen` | 1838–1922 | `screens/RegisterScreen.jsx` | `validate_invite` (1847) + `signUp` con `invite_token` en metadata (1859) |

### 5.2 Pantallas de negocio (COMGES)

| Componente | Líneas | Destino | Subcomponentes |
|---|---|---|---|
| `DashboardScreen` | 718–903 | `screens/DashboardScreen.jsx` | — |
| `ObjectivesScreen` | 908–1136 | `screens/ObjectivesScreen.jsx` | `InlineAddTask` (1138), `ObjModal` (1151) |
| `IncidentsScreen` | 1180–1291 | `screens/IncidentsScreen.jsx` | `IncModal` (1293), `IncDetail` (1354) |
| `EvidenceScreen` | 1386–1533 | `screens/EvidenceScreen.jsx` | `EvModal` (1535) |
| `OrgScreen` | 1583–1776 | `screens/OrgScreen.jsx` | 3 modos: vacío/lectura/edición |
| `UsersScreen` | 1927–2082 | `screens/UsersScreen.jsx` | solo admin; invitar, equipo, invitaciones |

### Lógica de negocio crítica a portar fiel

- **Dashboard — dos gauges** (718–903):
  - *Cumplimiento global* = promedio simple del % de tareas de todos los objetivos (746).
  - *Cumplimiento real* = suma ponderada por eje: ejes 1–4 → 20% c/u si el objetivo está 100% completo; ejes 5–6 → 10% c/u (751–759). El nº de eje sale de `code.match(/\d+/)` (752).
- **Objetivos — vinculación de evidencias** (962–1110): cada tarea tiene `evidence_id` y `evidence_id_2`. `globalUsedIds` (982) excluye de los desplegables las evidencias ya usadas por cualquier tarea. `unlinkEvidence` promueve la 2ª al primer slot si se quita la 1ª (969).
- **Incidentes — numeración** (1199–1201): `INC-{año}-{correlativo 4 dígitos}`.
- **Org — 3 modos de render** (1619–1775): aviso si miembro sin config (1619); solo-lectura si miembro o admin no editando (1628); formulario si admin editando.
- **Cross-screen highlight** (Objetivos→Evidencias): `onHighlightEvidence(id)` + `navigate('evidence')`; EvidenceScreen expande el objetivo y hace `scrollIntoView` (1408–1419).

---

## 6. App root → `App.jsx` + `main.jsx`

| Pieza | Líneas | Destino |
|---|---|---|
| `App()` | 2087–2245 | `App.jsx` |
| `ReactDOM.createRoot(...).render(<App/>)` | 2247 | `main.jsx` |

### Estado en `App` (candidato a hooks/context)
- `user`, `loading` → **`hooks/useAuth.js`** (getUser + onAuthStateChange, 2113–2118)
- `membership` `{org_id, role}`, `memLoading` → **`hooks/useMembership.js`** (2121–2145, incluye canje de invitación con `redeem_invite`)
- `framework` (null/comges/iso), `current`, `openInc`, `isMobile`, `drawerOpen`, `highlightEvidence`, `inviteToken`

### Máquina de estados de ruteo (2160–2244) — **portar el orden exacto**
```
1. loading                    → <Spinner full />
2. NOT_CONFIGURED             → <SetupScreen />
3. inviteToken && !user       → <RegistroScreen token=… />
4. !user                      → <LoginScreen />
5. !framework                 → <SelectionScreen />
6. framework === 'iso'        → layout + <IsoPendingScreen />
7. memLoading                 → <Spinner full />
8. !membership                → <NoOrgScreen />
9. (default)                  → layout + <Screen/> según `current`
```
Mapa `SCREENS` (2206–2213): dashboard/objectives/incidents/evidence/org/users.

Props que `App` inyecta a cada screen (2233–2240): `userId`, `orgId`, `role`, `onNavigate`, `highlightEvidence`, `onHighlightEvidence`.

---

## 7. Superficie Supabase (no tocar la BD; replicar las llamadas)

### Tablas y operaciones desde el cliente

| Tabla | Operaciones | Dónde (líneas) | Servicio destino |
|---|---|---|---|
| `profiles` | select/upsert | OrgScreen 1598, 1606 | `services/org.js` |
| `objectives` | select / insert / update / delete | Dashboard 726, Objectives 921/934/936/943, Evidence 1397 | `services/objectives.js` |
| `tasks` | insert / update / delete / toggle | Objectives 948/953/958/963 | `services/tasks.js` |
| `incidents` | select / insert / update / delete / count | Dashboard 727, Incidents 1188/1197/1201/1208/1212, App 2151 | `services/incidents.js` |
| `evidence` | select / insert / update / delete | Dashboard 728, Objectives 922, Evidence 1398/1423/1425/1432 | `services/evidence.js` |
| `memberships` | select / update / delete | App 2127/2133, Users 1975/1981 | `hooks/useMembership.js` + `services/members.js` |
| `invites` | select / insert / delete | Users 1942/1961/1986 | `services/invites.js` |
| `organizations` | (vía RPC / org_name) | — | — |

### RPC llamadas desde el cliente
| RPC | Línea | Uso |
|---|---|---|
| `validate_invite(p_token)` | 1847 | RegistroScreen valida token de URL |
| `redeem_invite(p_token)` | 2130 | App canjea invitación tras signUp |
| `list_org_members()` | 1941 | UsersScreen lista equipo |

*(El brief menciona `is_org_admin`/`is_org_member` — viven en RLS, no se llaman desde el cliente. `set_member`/`remove_member` tienen execute revocado: no usar.)*

### Auth
| Método | Línea |
|---|---|
| `signInWithPassword` | 415 |
| `signUp` (con `invite_token` en `options.data`) | 1859 |
| `getUser` | 2115 |
| `onAuthStateChange` | 2116 |
| `signOut` | 2171, 2185, 2203, 2224… |

---

## 8. Orden de extracción sugerido (riesgo creciente)

1. **tokens.css + global.css** (sin riesgo, solo CSS).
2. **lib/** (supabase singleton, constants, format).
3. **components/common/** (Btn, Badge, Field, Modal, EmptyState, Spinner, CsShieldLogo) — sin dependencias entre sí salvo iconos.
4. **components/layout/** (Sidebar, Topbar).
5. **Pantallas simples primero:** SetupScreen, NoOrgScreen, IsoPendingScreen, SelectionScreen, LoginScreen, RegisterScreen.
6. **Pantallas de negocio:** Dashboard → Incidents → Evidence → Objectives (la más compleja por la vinculación) → Org → Users.
7. **App.jsx** + hooks (useAuth, useMembership) + máquina de estados.
8. **services/** (refactor de las queries inline, último para no mover dos cosas a la vez).

> Regla de oro del brief: la migración es **reorganizar, no rediseñar**. Ante la duda, replicar el comportamiento exacto de estas líneas.

---

## 9. Fase 7 — Extensibilidad (POST-migración, toca el schema)

> No se hace durante la migración (el brief dice "no tocar la BD"). Va después, e incrementalmente.

**Objetivo:** que la app sirva para COMGES 2027 y años siguientes sin reescribir, y quede preparada para generalizar a otros marcos.

**Puntos de acoplamiento detectados (a resolver aquí):**
1. **Fórmula "Cumplimiento real"** hardcodeada en Dashboard (líneas 751–759): ejes 1–4 → 20%, ejes 5–6 → 10%, con `code.match(/\d+/)`. Es la pieza más rígida.
2. **Sin dimensión de período/año** en `objectives` (schema líneas 26–32): todos los objetivos se mezclan en una lista plana; agregar 2027 contamina el promedio de 2026.

**Camino A — uso año-tras-año (chico, alto valor):**
- Columna `period`/`year` en `objectives` → filtrar dashboard por período.
- Ponderación configurable (columna `weight` por objetivo, o config por marco) en vez de la fórmula fija.

**Camino B — "estándar"/multi-contexto (grande, decisión de producto):**
- Tabla `frameworks` real (en vez del toggle COMGES/ISO de `SelectionScreen` 615–628).
- Externalizar textos (la app deja de "saber" que es COMGES).

**Preparación gratis durante la migración:** al portar `DashboardScreen`, dejar la fórmula de ponderación **aislada en un solo módulo** (mismo comportamiento, pero no embebida en el JSX) para abaratar el Camino A.

---

## 10. Fase 8 — Informes con IA (Gemini) (POST-migración, requiere servidor)

> Genera informes de avance con la API de Gemini (disponible institucionalmente).

**Bloqueador 1 — seguridad de la key:** la API key de Gemini **NO es pública por diseño** (a diferencia de la anon key de Supabase). No puede ir en el cliente. La llamada corre en **servidor**:
- **Recomendado:** Supabase **Edge Function** `generate-report` (key como *secret*; valida JWT; consulta Supabase con la RLS del usuario; llama a Gemini; devuelve el informe).
- Alternativa: Serverless Function en Vercel.

**Bloqueador 2 — acceso a Drive:** hoy `evidence.file_url` guarda solo el link + metadatos, **no el contenido**. Un link de Drive requiere permisos; para leer el contenido hace falta "cualquiera con el enlace" (riesgoso) o la **Google Drive API** con cuenta de servicio. Gemini sí puede ingerir PDFs una vez obtenidos los bytes.

**Dos niveles:**
- **Nivel 1 (recomendado primero):** informe desde **datos estructurados** de Supabase (objetivos, %, tareas, incidentes, estados de evidencia, plazos). No necesita Drive. Bajo esfuerzo, alto valor.
- **Nivel 2:** Gemini analiza el **contenido** de los documentos de Drive. Requiere resolver acceso + gobernanza de datos.

**Minimización de datos (skill manejo-datos-sensibles) — obligatorio antes de enviar a Gemini:**
- Redactar PII por defecto: `encargado_nombre/correo` (profiles), `responsable` (objectives), `reported_by`/`owner` (incidents), emails de usuarios.
- Enviar solo datos agregados y estados (códigos, %, conteos, plazos).
- **Verificar del lado institucional** que el Gemini usado (idealmente Vertex AI / Workspace) **no usa los datos para entrenar**.
- Nivel 2: definir política de qué documentos sí/no se envían; dejar registro.

**UI propuesta:** botón "Generar informe" (Dashboard o nueva pantalla `screens/ReportsScreen.jsx`); mostrar el informe (markdown), permitir exportar/copiar. Opcional: tabla `reports` para histórico (cuidando que el texto puede contener datos).
