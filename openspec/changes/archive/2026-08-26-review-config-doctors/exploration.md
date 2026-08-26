# Exploration: review-config-doctors

> Comprehensive review of Config section + Doctor Management (schedule UI, prop chain, billing tab routing, secretary save permissions, and overall architecture). Read-only investigation.

## Current State

### 1. Doctor Schedule Settings UI — dark/dim contrast flaw CONFIRMED

**Files:**
- `client/src/features/doctors/components/sections/DoctorScheduleSettings.jsx` (197 lines)
- `client/src/features/doctors/components/sections/DoctorScheduleSettings.module.css`
- `client/src/features/appointments/components/schedule/ScheduleTimeBlock.jsx` (80 lines) + `.module.css` (132 lines)
- `client/src/features/appointments/components/schedule/ScheduleBulkActions.jsx` + `.module.css`
- `client/src/styles/variables.css` (309 lines) — tokens
- `client/src/components/atoms/Input.jsx` + `Input.module.css` (65 lines)
- `client/src/features/doctors/components/modals/DoctorEditModal.jsx` + `.module.css`

**How it works:**
`DoctorEditModal` tab `schedule` renders `DoctorScheduleSettings` (days loop + `ScheduleTimeBlock` per block + `ScheduleBulkActions` bulk toolbar). Day active state is `dayBlocks.length > 0` → adds modifier `DoctorScheduleSettings__scheduleDay--active`.

**Tokens (variables.css:194-209 dark default, 247-262 light, 294-309 dim):**
```css
--schedule-day-inactive-bg: var(--card-surface-bg);          /* dark: #0f172a, dim: #1e293b, light: #f1f5f9 */
--schedule-day-active-bg: rgba(var(--primary-rgb), 0.10);   /* teal 10% over whatever bg is behind it */
--schedule-day-border: var(--dashboard-card-border);         /* dark: rgba(255,255,255,.07) */
--schedule-day-active-border: var(--primary-color);          /* teal #0d9488 */
--schedule-container-bg: var(--dashboard-card-bg);           /* dark: #151d2a */
```

**Finding — active distinction is near-invisible in dark/dim:**
- Inactive: `background: #0f172a`, `border: rgba(255,255,255,.07)`, `opacity: 0.75`
- Active: `background: rgba(13,148,136,0.10)` layered over `#151d2a` parent → effective color is `#151d2a` + 10% teal tint → visually ~`#14282a` (Δ ≈ 3-4 on L). At 10% opacity the hue shift is imperceptible on a dark slate.
- Only reliable cue is `border-color: teal` (1px) + `opacity: 1` + `box-shadow: var(--shadow-md)` which is `0 8px 24px rgba(25,28,30,.06)` (barely visible on dark). And `.DoctorScheduleSettings__name` switches `color: var(--text-muted)` → `var(--text-main)` (`#94a3b8` → `#f8fafc`) — the strongest cue, but the day row's own bg/border still looks "disabled".
- `ScheduleTimeBlock` container uses `background: var(--dashboard-card-bg)` (#151d2a) not `--schedule-block-bg` — on an active day its cards are almost same luminance as the day row, so hierarchy is flat.
- **User report "no deja hacer nada o por contraste no veo nada" is credible**: the control *is* interactive (7 checkboxes, per-block + button), but the *inactive* rows at `opacity:0.75` look disabled, and the *active* tint at 10% is too subtle — user cannot tell which affordance is active vs muted. `accent-color` on checkbox alone is not enough.

**Finding — `<Input type="time">` dark-mode native picker contrast:**
- `Input.module.css` sets `--input-bg: var(--background-bg)` (#0b0f19) / `--input-text: var(--text-main)` (#f8fafc) — typed digits are fine.
- However the *native* `::-webkit-calendar-picker-indicator` (clock icon) and `::-webkit-datetime-edit` subfields inherit UA `color-scheme`. No `color-scheme: dark` is declared anywhere in the codebase (grep confirms 0 hits outside pnpm store). In Chromium on dark, without `color-scheme: dark` the picker indicator is rendered as dark-on-dark (nearly invisible) and the dropdown (if any) renders light. Firefox similar.
- Also no explicit `color-scheme` on `:root` or `.Input__root`, so OS `prefers-color-scheme` has no effect — app uses `data-theme` attribute, which the browser does not know to map to native controls.
- Impact: in `ScheduleTimeBlock` and `ScheduleBulkActions` the time inputs' clock icons are barely visible and the focus ring (`rgb(72 128 255 /15%)`) is weak on dark.

**Related CSS note:** `DoctorEditModal.module.css` still hardcodes non-token values (`background: rgb(255 255 255 /15%)`, `border: rgb(...)`, `color: var(--slate-900)` / `var(--slate-200)` without token definitions) — breaks dim consistency, flagged but out of narrow scope. `ScheduleBulkActions` already correctly uses `var(--schedule-container-bg)` after the recent `css-schedule-tab-remediation` tasks (see `openspec/changes/css-schedule-tab-remediation/tasks.md` — single-PR, low risk, now pending).

### 2. `setSchedule is not a function` — NO bug in live code; defensive gap only

**Prop chain (verified line-by-line):**
1. `client/src/features/doctors/hooks/useDoctorsPageController.js:231-234`:
   ```js
   onScheduleChange: (s) => setModalState(prev => ({
     ...prev, schedule: typeof s === 'function' ? s(prev.schedule) : s
   })),
   ```
   Supports functional updater form (all callers in `DoctorScheduleSettings.jsx` use `setSchedule(prev => ...)` at lines 50,64,68,72,93 and line 43). So `prev` pattern is required and preserved.
2. `client/src/features/doctors/DoctorsPage.jsx:18` → `<DoctorsManager {...controller} />` spreads entire controller including `handlers` + `modalState`.
3. `client/src/features/doctors/components/views/DoctorsManager.jsx:9-18,78-79` destructures `handlers, modalState` and passes `setSchedule={handlers.onScheduleChange}` plus `schedule={modalState.schedule}` into `DoctorEditModal`.
4. `client/src/features/doctors/components/modals/DoctorEditModal.jsx:32-34,203-206` declares `schedule, setSchedule` and forwards both verbatim to `<DoctorScheduleSettings doctorId schedule setSchedule loading={loadingSchedule} />`.
5. `client/src/features/doctors/components/sections/DoctorScheduleSettings.jsx:24-28,46-93` consumes `setSchedule` without default — all mutation helpers call it with functional updater.

**Verdict:** live chain is correct. No missing prop, no renamed handler. `git log` for recent renames shows no regression. Reported error would only occur if:
- An ad-hoc rendering of `DoctorScheduleSettings` omits `setSchedule` (e.g., story/test), or
- A stale bundle / HMR fragment was cached (user seeing old `DoctorScheduleSettings` expecting `onScheduleChange` prop name).

**Residual risk (non-bug but worth hardening):** `DoctorScheduleSettings.jsx` has no default for `setSchedule` (`schedule = EMPTY_SCHEDULE` has a default, `setSchedule` does not). And `client/src/features/config/components/sections/BillingSettings.jsx:272-285` renders `DoctorEditModal` *without* `schedule / setSchedule / loadingSchedule` when editing fiscal from the billing tab. That modal opens with `activeTab='fiscal'`, so the schedule tab is not initially mounted — safe today. But if the user switches to the `schedule` tab inside that billing-launched modal, `DoctorScheduleSettings` will receive `setSchedule === undefined` and throw `TypeError: setSchedule is not a function` (toggleDay/handleAddBlock/handleBlockChange all call it). Functional tests (`DoctorScheduleSettings.functional.test.jsx`) mock `setSchedule` properly, so this edge is untested. Recommend adding a no-op default or guard.

### 3. `/config?tab=billing` "no funciona" — CODE IS CORRECT; likely a UX/visibility misdiagnosis

**Route + guard:**
- `client/src/routes/AppRouter.jsx:98-102`:
  ```jsx
  <Route path="/config" element={<RoleGuard allowedRoles={['admin','secretary']}><SystemConfigPage/></RoleGuard>} />
  ```
  Both target roles allowed.

**Registry wiring:**
- `client/src/features/config/SystemConfigPage.jsx:20-46` (`SettingsContent`) does:
  ```js
  const section = useMemo(() => getConfigSection(activeTab), [activeTab]);
  if (!section) return null;
  const { metadata, Component } = section;
  return <><header>{metadata.title/desc/icon}</header><Suspense><Component controller={controller}/></Suspense></>
  ```
  `activeTab` comes from `useSystemConfigController` (`searchParams.get('tab') || 'modules'`). No manual `replaceState`; deep links and back/forward are native via `useSearchParams`. `SystemConfigPage` also filters tabs by role:
  ```js
  visibleSections = sections.filter(s => !s.metadata?.allowedRoles || s.metadata.allowedRoles.includes(userRole))
  ```
  Tabs prop to `FeatureToolbar` is `visibleSections.map(s => ({id,title,icon}))`.

**Loader mapping:**
- `client/src/features/config/components/ConfigRegistryLoader.jsx:47-53`:
  ```js
  const BillingSettingsWrapper = ({ controller }) => (
    <BillingSettings user={controller.user} settings={controller.settings} updateSetting={controller.handlers.updateSetting} />
  );
  ```
  Signature `BillingSettings({ user, settings, updateSetting })` at `BillingSettings.jsx:21` matches exactly.

**Registration:**
- `ConfigRegistryLoader.jsx:68`:
  ```js
  registerConfigSection('billing', { title, icon:'payments', desc, allowedRoles:['admin','secretary'] }, BillingSettingsWrapper);
  ```
  Lazy import is `React.lazy(() => import('../components/sections/BillingSettings').then(m => ({ default: m.BillingSettings })))` — correct for named export.

**Test expectation confirms:** `ConfigRegistryLoader.test.jsx:39-43` asserts `billing.allowedRoles === ['admin','secretary']`.

**Why the report then?** Three plausible causes that are *not* code bugs:
1. **Role scoping confusion:** if the reporter was logged in as `doctor`, billing tab is hidden (filtered out). But `RoleGuard` at `/config` allows `admin|secretary` only — a doctor would be redirected to default fallback (`/dashboard` or `/config?tab=users`) so the URL bar retains `?tab=billing` but the rendered tab is `modules` (fallback `searchParams.get('tab') || 'modules'` + null section returns null). Looks like "no funciona".
2. **Registry lazy init timing:** `SystemConfigPage.jsx:58-61` initializes via `useState(() => { loadDefaultConfigSections(t); return getConfigSections(); })` — run once. If `t` translations load async after first paint, titles update but ids stay; not a bug. However double-registration guard is absent — `registerConfigSection` is a bare `Map.set` (no idempotency). Navigating away and back does not re-init because the `useState` initializer only runs on mount; but hot-reload or fast refresh could register duplicate entries with stale `t` closures.
3. **`BillingSettings` self-fetch of doctors (`useFetch('/users/doctors')`)** could fail (401/403) and the table shows empty/loading, interpreted as "billing tab blank".

**Recommendation:** add a visible empty-state vs error distinction and log the failing fetch; add a dev-only assertion that `activeTab` param that yields `!section` renders a small "unknown tab" message instead of `null`.

### 4. Secretary (Stella) permission to SAVE config — ALLOWED by design

**Server guard:**
- `server/routes/system/settingsRoutes.js:13-14`:
  ```js
  router.post('/', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), settingsController.updateSetting);
  router.post('/refresh-tunnel', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), settingsController.refreshTunnel);
  ```
- `server/constants/roles.js:12`:
  ```js
  MANAGE_CORE_DATA: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR]
  ```
  Secretary is explicitly included. `authorize` middleware (`server/middleware/authorize.js:3-15`) checks `req.user.role` (from JWT) against the allow-list — pure role check, no granular `can_*` flag needed.

**Client save path:**
- `client/src/context/ConfigContext.jsx:7-9` default has no-op `updateSetting`.
- Real `updateSetting` lives in `client/src/context/useConfigLogic.js:63-74`: optimistic `dispatch(UPDATE_SETTING)` then `await api.post('/settings', {key, value})`; on catch, `fetchSettings()` reverts. This is called from `BillingSettings.jsx:107` (`updateSetting('afip_environment', value)`) and from other config sections via `ConfigToggle`/`ConfigField`.
- Consumption: `useSystemConfigController` re-exports `updateSetting` from `useConfig()`; `ConfigRegistryLoader` wrappers forward `controller.handlers.updateSetting`.

**Granular vs coarse confusion:**
- Granular permissions (`server/scripts/migrations/26_granular_secretary_permissions.sql` + `server/01-schema.sql: can_manage_users, can_crud_* ... token_version`) govern per-feature domain mutations (appointments, prescriptions, etc.) and are enforced via `authorizePermission('can_...')`. They do **not** gate `POST /settings`. That route uses `ACCESS_LEVELS.MANAGE_CORE_DATA` (coarse roles). So even a secretary with `can_manage_users=false` and all `can_crud_*=false` can still save AFIP/environment settings — this is intentional (archived decision `2026-08-21-granular-secretary-permissions` + `2026-08-22-doctor-fiscal-settings-and-role-config`).
- JWT payload in `server/services/user/authService.js:131-165` embeds `permissions` dict plus `canManageUsers` alias; `server/middleware/authMiddleware.js:28-44` checks `token_version` for eviction after permission updates. None of this affects settings writes.

**DB driver:**
- `server/db.js:8-22` uses `mariadb@3` dynamic import, `host: process.env.DB_HOST || 'localhost'`, `database: process.env.DB_NAME || 'clinical_management'`. No SQLite fallback at runtime (despite `openspec/config.yaml` listing SQLite — docs drift).

**Admin reset note:**
- `server/scripts/maintenance/reset_admin.js:1-17` hardcodes `bcrypt.hash('admin123',10)` and `UPDATE users SET password_hash=? WHERE username='admin'`. Operational risk: running it in production resets admin to a weak known password; no audit log, no token_version bump.

### 5. General config/doctors architecture

**Client feature map (absolute paths):**
```
client/src/features/config/
  SystemConfigPage.jsx                  — orchestrator, registry renderer, tab filtering
  SystemConfigPage.module.css
  hooks/useSystemConfigController.js    — URL ?tab sync, Google handlers, updateSetting passthrough
  registry/configRegistry.js            — Map registry (register/get)
  components/ConfigRegistryLoader.jsx   — lazy imports + 5 wrappers, role scoping
  components/ConfigRegistryLoader.test.jsx
  components/ui/ConfigField.jsx/.css    — reusable field (select/text)
  components/ui/ConfigToggle.jsx/.css
  components/sections/BillingSettings.jsx/.module.css  — AFIP env + doctor fiscal matrix + DoctorEditModal launch
  components/sections/CommunicationSettings.jsx
  components/sections/IntegrationSettings.jsx (+ subcomponents GoogleCalendar/MetaWhatsApp/RemoteAccess)
  components/sections/ModulesSettings.jsx
  components/forms/MessageTemplateEditor.jsx

client/src/features/doctors/
  DoctorsPage.jsx                       — MainLayout + DoctorsManager spread
  hooks/useDoctorsPageController.js     — modalState (isOpen/type/activeTab/schedule/data), handlers, buildDoctorInitialData pure helper
  components/views/DoctorsManager.jsx   — grid + DoctorCard list + DoctorEditModal portal (prop bridge)
  components/cards/DoctorCard.jsx
  components/modals/DoctorEditModal.jsx/.module.css — tabbed modal (profile/tariffs/schedule/messages/google/fiscal)
  components/modals/DoctorGoogleHandoverModal.jsx
  components/sections/DoctorScheduleSettings.jsx/.module.css — 7-day toggle + ScheduleBulkActions + ScheduleTimeBlock
  components/sections/DoctorTariffsForm.jsx
  components/sections/DoctorGoogleSettings.jsx
  components/sections/DoctorFiscalWizard.jsx
  components/sections/DoctorMessagesForm.jsx
  components/sections/__tests__/DoctorScheduleSettings.functional.test.jsx
  components/sections/__tests__/ScheduleRemediation.smoke.test.jsx

client/src/features/users/
  AdminUsersPage.jsx                    — subtab secretaries|doctor, hosts DoctorsManager (second mounting point)
  utils/tabs.js                         — resolveTab

client/src/context/
  ConfigContext.jsx                     — createContext(default) + Provider via useConfigLogic(user)
  useConfigLogic.js                     — reducer + fetchSettings + updateSetting optimistic

client/src/routes/AppRouter.jsx         — lazy routes, RoleGuard wrappers
client/src/components/auth/RoleGuard.jsx
client/src/hooks/usePermissions.js
client/src/styles/variables.css, base.css, shared.module.css ...
```

**Config registry load flow:**
`SystemConfigPage` mount → `useState` initializer `loadDefaultConfigSections(t)` once → five `registerConfigSection(id, metadata, Wrapper)` into `Map` → `getConfigSections()` snapshot → `visibleSections` filter by `user.role` → `FeatureToolbar` tabs → `SettingsContent` resolves `getConfigSection(activeTab)` → renders `<Wrapper controller={controller}/>` inside `Suspense`. Moving users/doctors into `/config?tab=users&subtab=doctor` is the `move-users-to-config` change (archive pending). This explains the dual mount of `DoctorsManager`: via `/config?tab=users` (AdminUsersPage) and legacy `/doctors` redirect.

**Doctors controller exposure:**
`useDoctorsPageController` returns `{ doctors, loading, searchTerm, setSearchTerm, settings, currentUser, filteredDoctors, modalState, handlers, t }` where `handlers` bundles all mutations. `DoctorsManager` is a pure view that receives the controller spread as props (no internal state). This makes the prop chain testable but couples modal state to a single `modalState` object (large shape). `buildDoctorInitialData` is intentionally pure for unit tests.

**Cross-cutting concerns:** `openspec/config.yaml` declares `testing: pnpm --filter server test` (Jest), `strict_tdd: true`. Client tests are Vitest (`pnpm --filter client test` — not in config.yaml but present via scripts). Server secrets via `dotenv` + `process.env.DB_HOST/DB_PASSWORD/JWT_SECRET`.

---

## Affected Areas

- `client/src/styles/variables.css:194-262,294-309` — schedule tokens too subtle (active 10% tint).
- `client/src/features/doctors/components/sections/DoctorScheduleSettings.module.css:37-51,63-68,80-85` — inactive opacity + name color contrast, day border reliance.
- `client/src/features/appointments/components/schedule/ScheduleTimeBlock.module.css:3-21,90-97` — container bg collision, missing `color-scheme`, divider/hardcoded borders.
- `client/src/features/appointments/components/schedule/ScheduleBulkActions.module.css` — already remediated; keep as reference.
- `client/src/components/atoms/Input.module.css:1-28` — missing `color-scheme: dark/light` adaptation for `type=time`.
- `client/src/components/atoms/Input.jsx:11-26` — forwards native props but no `colorScheme` handling.
- `client/src/features/doctors/components/sections/DoctorScheduleSettings.jsx:24-47,71-85` — needs default/no-op for `setSchedule` + guard; `useEffect` key injection could be replaced with stable id.
- `client/src/features/doctors/components/modals/DoctorEditModal.module.css:1-118` — hardcoded `rgb(255...` and `var(--slate-*)` not tokenized (blocks dim).
- `client/src/features/config/components/sections/BillingSettings.jsx:21-53,272-285` — wrapper prop mapping verified; modal launch without schedule props is the latent `setSchedule` crash.
- `client/src/features/config/SystemConfigPage.jsx:20-46,58-66` — `if (!section) return null` silent failure, no unknown-tab UI; registry double-register not guarded.
- `client/src/features/config/components/ConfigRegistryLoader.jsx:12-53,64-70` — role scoping verified; lazy wrappers correct.
- `client/src/features/config/hooks/useSystemConfigController.js:28-36` — URL tab sync correct.
- `client/src/routes/AppRouter.jsx:98-102` — guard correct (`admin|secretary`).
- `client/src/context/useConfigLogic.js:63-74` — optimistic save correct.
- `client/src/context/ConfigContext.jsx:5-9` — default context no-op.
- `server/constants/roles.js:7-25` — `MANAGE_CORE_DATA` includes secretary (save allowed).
- `server/routes/system/settingsRoutes.js:12-14` — enforce `authorize(MANAGE_CORE_DATA)`; no granular check (intentional).
- `server/middleware/authorize.js:3-44` — role vs permission split.
- `server/middleware/authMiddleware.js:28-44` — token_version eviction.
- `server/01-schema.sql:1444-1459` — users table with 8 perms + token_version (source of truth; migration 26 already merged).
- `server/scripts/maintenance/reset_admin.js:1-17` — weak password reset hazard.
- `server/db.js:8-22` — mariadb driver, env-driven.

## Approaches

### 1. **Minimal contrast hotfix + hardening** — raise active differentiation + time-input visibility + defensive setSchedule
- **Changes:** bump `--schedule-day-active-bg` to `rgba(var(--primary-rgb),0.16)` (dark/dim) and `0.08→0.12` check in light (keep 10% only for light where contrast is higher), increase `--schedule-day-active-border` to 2px, drop `opacity:0.75` on inactive to 1 or raise inactive bg slightly (`--card-surface-bg` → mix), add `color-scheme: dark` (and `light` for light theme) to `Input__root` + explicit `::-webkit-calendar-picker-indicator { filter: invert(0.7) }` scoped to `data-theme="dark"|"dim"`, add `setSchedule = () => {}` default param + guard in `DoctorScheduleSettings`, pass empty schedule handlers when `BillingSettings` launches `DoctorEditModal` or prevent tab switch to schedule from that path, add unknown-tab fallback in `SystemConfigPage`.
- Pros: smallest diff, immediately addresses user-reported invisibility; no API change; low regression.
- Cons: still carries some tech debt (DoctorEditModal.module.css hardcoded colors, ScheduleTimeBlock container not tokenized).
- Effort: Low

### 2. **Token-complete remediation (extend css-schedule-tab-remediation)** — finish tokenization + native control theming + modal scope fix
- **Changes:** everything in (1) plus: migrate `DoctorEditModal.module.css` hardcoded `rgb(...)`/`var(--slate-*)` to `--card-surface-bg`/`--border-color`/`--text-secondary`, switch `ScheduleTimeBlock__container` to `var(--schedule-block-bg)` and `border: var(--schedule-block-border)`, add `accent-color` + `color-scheme` pairs to checkbox/time inputs, add unit test for `BillingSettings`→`DoctorEditModal` schedule path, clean `Input` focus ring per theme.
- Pros: coherent design-token story, fixes all three themes consistently, closes `css-schedule-tab-remediation` follow-ups, improves maintainability.
- Cons: touches ~6 CSS files + 2 JSX, larger review (but still < ~180 lines if scoped).
- Effort: Medium

### 3. **Decouple schedule state + separate fiscal modal** — architectural refactor
- **Changes:** extract `useDoctorScheduleController(doctorId)` hook to own schedule domain (isolate `schedule` + `loadingSchedule` from the fat `modalState`), introduce `FiscalEditModal` lightweight wrapper so `BillingSettings` does not mount the full 6-tab `DoctorEditModal`, registry guard `if (registry.has(id)) return` to allow HMR, move settings save behind a service method with proper error surface (toast + revert) instead of silent console.error.
- Pros: eliminates latent props-missing crash by design, reduces `DoctorsManager` coupling, improves testability.
- Cons: notably more churn, two new components + hook, higher review budget (exceeds 400-line guard if combined with styling), not needed to unblock the user-reported bugs.
- Effort: High

## Recommendation

**Approach 1 (Minimal hotfix + hardening) for the immediate `review-config-doctors` proposal, with a follow-up ticket for Approach 2 token-completeness.**

Rationale: the user's pain is *visibility*, not architecture. Raising active contrast (tint + border + removing muted opacity) plus `color-scheme` for time inputs will make the schedule tab usable in dark/dim with < ~40 changed lines. Defensive `setSchedule` default and `SystemConfigPage` unknown-tab fallback prevent the two latent crashes/unblank states without a refactor. Keep scope tight to satisfy strict TDD and the 400-line review budget (delivery_strategy auto-chain, review_budget_lines 1000 supports at most ~2-3 chained PRs if needed — but this proposal should be a single PR). Queue Approach 2 as `css-schedule-tab-remediation` phase 2 rather than bundling it now.

**Concrete proposal shape:**
- Spec domain(s): `config-doctors` (or split `schedule-accessibility` + `config-billing-nav` if preferred).
- Requirements to assert: schedule day active state meets WCAG contrast ratio vs inactive in dark/dim; time inputs' native indicator visible in all themes; `setSchedule` never throws; `/config?tab=billing` renders BillingSettings for admin+secretary and renders an explicit "unknown tab" otherwise; `POST /settings` remains allowed for `MANAGE_CORE_DATA` (secretary).
- Out of scope: full DoctorEditModal re-theming, mobile, granular permission changes, DB driver docs (SQLite mention in config.yaml).

## Risks

- Raising `--schedule-day-active-bg` opacity too high will wash out the card's text contrast in light theme — verify against `--text-main` per theme, not just dark.
- Adding `color-scheme` to `Input` may affect all `type=time|date|datetime-local` inputs app-wide (appointments, rentals, holidays) — test each page in all three themes and in Safari (which ignores `::-webkit-calendar-picker-indicator` filter).
- Optimistic `updateSetting` masks server 403 as a flash-then-revert — proposals should add a toast on catch with the server message, otherwise secretary failures look like "nothing saved".
- `reset_admin.js` with `admin123` is a credential hazard if ever invoked via CI — recommend env-guarding it (`if (process.env.NODE_ENV === 'production') throw`) or deleting.
- Registry `Map` without idempotency means HMR or double mount in StrictMode (dev) duplicates sections with stale `t` — guard with early-return or `registry.clear()` before re-register.

## Ready for Proposal

Yes — evidence is complete for all five scoped areas with file:line citations. Next phase is `sdd-propose` for change `review-config-doctors` building on this exploration. No blocker questions remain; proposal can draft delta specs without further discovery.

## File Inventory (absolute paths)

- `/home/jmro/secretary-app/client/src/features/doctors/components/sections/DoctorScheduleSettings.jsx`
- `/home/jmro/secretary-app/client/src/features/doctors/components/sections/DoctorScheduleSettings.module.css`
- `/home/jmro/secretary-app/client/src/features/appointments/components/schedule/ScheduleTimeBlock.jsx`
- `/home/jmro/secretary-app/client/src/features/appointments/components/schedule/ScheduleTimeBlock.module.css`
- `/home/jmro/secretary-app/client/src/features/appointments/components/schedule/ScheduleBulkActions.jsx`
- `/home/jmro/secretary-app/client/src/features/appointments/components/schedule/ScheduleBulkActions.module.css`
- `/home/jmro/secretary-app/client/src/styles/variables.css`
- `/home/jmro/secretary-app/client/src/components/atoms/Input.jsx`
- `/home/jmro/secretary-app/client/src/components/atoms/Input.module.css`
- `/home/jmro/secretary-app/client/src/features/doctors/components/modals/DoctorEditModal.jsx`
- `/home/jmro/secretary-app/client/src/features/doctors/components/modals/DoctorEditModal.module.css`
- `/home/jmro/secretary-app/client/src/features/doctors/hooks/useDoctorsPageController.js`
- `/home/jmro/secretary-app/client/src/features/doctors/DoctorsPage.jsx`
- `/home/jmro/secretary-app/client/src/features/doctors/components/views/DoctorsManager.jsx`
- `/home/jmro/secretary-app/client/src/features/config/SystemConfigPage.jsx`
- `/home/jmro/secretary-app/client/src/features/config/SystemConfigPage.module.css`
- `/home/jmro/secretary-app/client/src/features/config/hooks/useSystemConfigController.js`
- `/home/jmro/secretary-app/client/src/features/config/registry/configRegistry.js`
- `/home/jmro/secretary-app/client/src/features/config/components/ConfigRegistryLoader.jsx`
- `/home/jmro/secretary-app/client/src/features/config/components/sections/BillingSettings.jsx`
- `/home/jmro/secretary-app/client/src/features/config/components/sections/BillingSettings.module.css`
- `/home/jmro/secretary-app/client/src/features/users/AdminUsersPage.jsx`
- `/home/jmro/secretary-app/client/src/context/ConfigContext.jsx`
- `/home/jmro/secretary-app/client/src/context/useConfigLogic.js`
- `/home/jmro/secretary-app/client/src/routes/AppRouter.jsx`
- `/home/jmro/secretary-app/client/src/components/auth/RoleGuard.jsx`
- `/home/jmro/secretary-app/client/src/hooks/usePermissions.js`
- `/home/jmro/secretary-app/server/constants/roles.js`
- `/home/jmro/secretary-app/server/routes/system/settingsRoutes.js`
- `/home/jmro/secretary-app/server/controllers/system/settingsController.js`
- `/home/jmro/secretary-app/server/middleware/authorize.js`
- `/home/jmro/secretary-app/server/middleware/authMiddleware.js`
- `/home/jmro/secretary-app/server/db.js`
- `/home/jmro/secretary-app/server/01-schema.sql`
- `/home/jmro/secretary-app/server/scripts/migrations/26_granular_secretary_permissions.sql`
- `/home/jmro/secretary-app/server/scripts/maintenance/reset_admin.js`
- `/home/jmro/secretary-app/server/services/user/authService.js`
- `/home/jmro/secretary-app/openspec/changes/css-schedule-tab-remediation/tasks.md`
- `/home/jmro/secretary-app/openspec/config.yaml`

## Evidence Index (file:line spot checks)

- Schedule tokens dark: `variables.css:198` `--schedule-day-active-bg: rgba(var(--primary-rgb),0.10)`; active border `:200`; inactive `:197`.
- Day style: `DoctorScheduleSettings.module.css:37-51` (inactive opacity 0.75, active border+shadow).
- Time picker: `Input.module.css:1-28` (no color-scheme), grep `color-scheme` → 0 in `client/src` (excluding pnpm store).
- Prop chain: `useDoctorsPageController.js:231` onScheduleChange, `DoctorsManager.jsx:78` setSchedule prop, `DoctorEditModal.jsx:32,205` pass-through, `DoctorScheduleSettings.jsx:24,50,72` functional updater.
- Billing launch without schedule: `BillingSettings.jsx:272-285` DoctorEditModal sans schedule props; `DoctorScheduleSettings.jsx:27` no default for setSchedule.
- Billing route guard: `AppRouter.jsx:98-102` RoleGuard admin+secretary; wrapper mapping `ConfigRegistryLoader.jsx:47-52`; registry `registerConfigSection('billing'...) :68`; SettingsContent `SystemConfigPage.jsx:20-32`.
- Save permission: `settingsRoutes.js:13` `authorize(MANAGE_CORE_DATA)`, `roles.js:12` includes secretary, `useConfigLogic.js:63` POST /settings, `ConfigContext.jsx:7` default.
- DB/permissions: `01-schema.sql:1450-1460` users columns, `26_granular_secretary_permissions.sql:3-11` migration, `authService.js:131-140` permissions payload.
