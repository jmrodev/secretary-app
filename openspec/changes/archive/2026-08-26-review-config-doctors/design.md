# Design: review-config-doctors

## Technical Approach

Implement Approach 1 (Minimal hotfix + hardening) per the proposal. Four independent but coordinated changes across CSS tokens, Input atom, DoctorScheduleSettings component, and Config registry/page — all in a single PR under 400 lines. No server changes; server already allows secretary via `MANAGE_CORE_DATA` (coarse RBAC). Document follow-up risks for optimistic 403-masking and `reset_admin.js` weak password.

## Architecture Decisions

### Decision: Schedule Token Adjustment Strategy

**Choice**: Raise `--schedule-day-active-bg` to `rgba(var(--primary-rgb), 0.16)` for dark/dim; `0.12` for light. Increase `--schedule-day-active-border` to `2px`. Remove `opacity: 0.75` from inactive rows (set to `1`). Keep `ScheduleTimeBlock` container on `--dashboard-card-bg` for now (follow-up ticket for `--schedule-block-bg`).

**Alternatives considered**:
- Full token migration (Approach 2): migrate `DoctorEditModal.module.css` hardcoded `rgb(...)` and `var(--slate-*)`, switch `ScheduleTimeBlock` to `--schedule-block-bg`. Rejected: exceeds review budget, not required to unblock user pain.
- Higher alpha (0.20+): Rejected: washes out `--text-main` in light theme at 0.12 cap.

**Rationale**: 0.16 dark/dim + 2px border gives ΔL ≥ 10 vs inactive; 0.12 light keeps WCAG AA contrast with `--text-main` (#0f172a on #fff tinted). Removing inactive opacity eliminates "disabled" appearance.

### Decision: Input Atom `color-scheme` Scoping

**Choice**: Add `color-scheme: dark` to `.Input__root` under `[data-theme="dark"]` and `[data-theme="dim"]` via CSS attribute selectors. Add `::-webkit-calendar-picker-indicator { filter: invert(0.7) }` scoped to same themes. Light theme gets `color-scheme: light` explicitly.

**Alternatives considered**:
- `:root { color-scheme: dark light }`: Rejected — app uses `data-theme` not `prefers-color-scheme`; browser won't map correctly.
- JS-side `colorScheme` prop on Input: Rejected — adds prop surface area; CSS-only is simpler and covers all usages.

**Rationale**: CSS attribute selectors on `data-theme` align with app's theming strategy. Scoping to `type="time"` via `input[type="time"]` selector limits blast radius. Safari ignores `::-webkit-` filter — documented as manual test gap.

### Decision: `setSchedule` Defensive Default

**Choice**: Add default parameter `setSchedule = () => {}` in `DoctorScheduleSettings` destructuring. Keep functional updater form in all mutation helpers. In `BillingSettings`, pass empty schedule handlers (`schedule: [], setSchedule: () => {}, loadingSchedule: false`) when launching `DoctorEditModal`.

**Alternatives considered**:
- Guard calls with `if (setSchedule)`: Rejected — verbose, doesn't fix functional updater pattern.
- Separate `FiscalEditModal`: Rejected — architectural refactor (Approach 3), out of scope.

**Rationale**: Default param is a one-line fix that covers both ad-hoc renders and billing-launched modal. Passing empty handlers from `BillingSettings` ensures `DoctorEditModal` forwards a callable to `DoctorScheduleSettings` when schedule tab activates.

### Decision: Config Registry Idempotency & Unknown Tab UI

**Choice**: 
1. `configRegistry.registerConfigSection`: early-return `if (registry.has(id)) return;`
2. `SystemConfigPage.SettingsContent`: replace `if (!section) return null` with explicit fallback component rendering "Tab not found: {activeTab}" and a link to first allowed tab.

**Alternatives considered**:
- Redirect on unknown tab: Rejected — breaks deep-link UX, loses context.
- Silent `null` with console.warn: Rejected — user sees blank page.

**Rationale**: Early-return guard is zero-cost and prevents HMR/StrictMode duplicates. Explicit fallback UI improves debuggability and matches spec scenarios.

### Decision: Secretary Save Permission — No Code Change

**Choice**: Document in spec that `POST /settings` uses `MANAGE_CORE_DATA` (includes `secretary`) — coarse RBAC, not granular `can_*`. No server modification needed.

**Alternatives considered**: Add granular check. Rejected — archived decisions confirm intentional design.

**Rationale**: Exploration verified `server/constants/roles.js:12` includes `SECRETARY` in `MANAGE_CORE_DATA`; `settingsRoutes.js:13` enforces it; client optimistic save works. Granular flags (`can_manage_users`, `can_crud_*`) govern domain mutations only.

## Data Flow

```
User Interaction (Schedule Tab)
    │
    ▼
DoctorScheduleSettings (day toggle / block edit)
    │
    ├── setSchedule(prev => next)  ──► useDoctorsPageController.onScheduleChange
    │                                        │
    │                                        ▼
    │                                 modalState.schedule update
    │                                        │
    │                                        ▼
    │                              DoctorEditModal (via props)
    │                                        │
    └── Default no-op () => {}  ◄───────────┘  (if prop missing)

BillingSettings → DoctorEditModal (fiscal tab)
    │
    ├── Passes schedule=[], setSchedule=()=>{}, loadingSchedule=false
    │
    └── User switches to schedule tab
             │
             ▼
      DoctorEditModal forwards setSchedule to DoctorScheduleSettings
             │
             ▼
      Default no-op or real handler invoked safely

Config Navigation (/config?tab=X)
    │
    ▼
SystemConfigPage → getConfigSection(activeTab)
    │
    ├── section exists → render Component
    │
    └── section missing → render ConfigTabFallback { activeTab, visibleTabs }
           │
           ▼
      Registry idempotency: registerConfigSection guards duplicate Map.set
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `client/src/styles/variables.css` | Modify | Raise `--schedule-day-active-bg` alpha (dark/dim 0.10→0.16, light 0.10→0.12). Set `--schedule-day-active-border-width: 2px` (new token) or use `2px solid var(--schedule-day-active-border)` in component CSS. |
| `client/src/features/doctors/components/sections/DoctorScheduleSettings.module.css` | Modify | Remove `opacity: 0.75` from `.DoctorScheduleSettings__scheduleDay`. Ensure active border is 2px. Keep `--schedule-day-active-border` color token. |
| `client/src/components/atoms/Input.module.css` | Modify | Add `[data-theme="dark"] .Input__root, [data-theme="dim"] .Input__root { color-scheme: dark; }` and `[data-theme="light"] .Input__root { color-scheme: light; }`. Add `input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.7); }` scoped to dark/dim. |
| `client/src/features/doctors/components/sections/DoctorScheduleSettings.jsx` | Modify | Add `setSchedule = () => {}` default in destructuring (line 27). No other logic changes. |
| `client/src/features/config/components/sections/BillingSettings.jsx` | Modify | In `handleEditDoctorFiscal` (line 67-78), add `schedule: [], setSchedule: () => {}, loadingSchedule: false` to `setModalState` payload. |
| `client/src/features/config/SystemConfigPage.jsx` | Modify | Replace `if (!section) return null` (line 24) with fallback component. Import or inline `ConfigTabFallback`. |
| `client/src/features/config/registry/configRegistry.js` | Modify | Add `if (registry.has(id)) return;` at top of `registerConfigSection`. |

## Interfaces / Contracts

### `DoctorScheduleSettings` Props (Modified)

```jsx
export const DoctorScheduleSettings = ({
    doctorId,
    schedule = EMPTY_SCHEDULE,
    setSchedule = () => {},  // NEW: default no-op
    loading
}) => { ... }
```

### `BillingSettings` Modal State (Extended)

```jsx
setModalState({
    isOpen: true,
    activeTab: 'fiscal',
    data: initialData,
    connected: false,
    loadingGoogle: false,
    loadingSchedule: false,
    schedule: [],           // NEW: empty schedule
    setSchedule: () => {}   // NEW: no-op default
});
```

### `ConfigTabFallback` Component (New, inline or extracted)

```jsx
const ConfigTabFallback = ({ activeTab, visibleTabs }) => (
    <div className={shared.ConfigSection}>
        <div className={shared.ConfigSection__body}>
            <p className={styles.ConfigTabFallback__message}>
                {t('config_tab_not_found', { tab: activeTab })}
            </p>
            {visibleTabs.length > 0 && (
                <a href={`/config?tab=${visibleTabs[0].id}`} className={styles.ConfigTabFallback__link}>
                    {t('config_tab_redirect', { tab: visibleTabs[0].label })}
                </a>
            )}
        </div>
    </div>
);
```

### `configRegistry.registerConfigSection` (Guarded)

```js
export const registerConfigSection = (id, metadata, Component) => {
    if (registry.has(id)) return;  // NEW: idempotency guard
    registry.set(id, { metadata, Component });
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `DoctorScheduleSettings` renders without `setSchedule`; no TypeError on interaction | Vitest: mount component without `setSchedule`, fire checkbox/block events, expect no throw |
| Unit | `configRegistry.registerConfigSection` idempotency | Vitest: call twice with same id, assert `getConfigSections().length === 1` |
| Unit | `SystemConfigPage.SettingsContent` renders fallback for unknown tab | Vitest: mock `getConfigSection` to return undefined, assert fallback text present |
| Component | Schedule day active/inactive contrast tokens | Visual regression (Chromatic) or manual: verify dark/dim/light themes show ΔL ≥ 10, 2px border |
| Component | Time input clock icon visible in dark/dim | Manual: open schedule in dark/dim, verify `type="time"` picker indicator inverted; test Chrome, Firefox, Safari |
| Component | BillingSettings → DoctorEditModal schedule tab switch | Manual: open billing, click doctor fiscal edit, switch to schedule tab, verify no crash |
| Integration | Secretary saves `afip_environment` via ConfigContext | Existing E2E or manual: login as secretary, change AFIP env, verify persist |
| Regression | All existing `type="time"` inputs (appointments, rentals, holidays) | Manual smoke: navigate each page in 3 themes, verify no visual regression on native pickers |

**Strict TDD alignment**: Unit tests for new guards (idempotency, fallback render, no-op default) written FIRST (RED), then implementation (GREEN). Visual/contrast tests are manual (no automated WCAG tooling in repo).

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary changes. All changes are frontend CSS/JS with no new process boundaries.

## Migration / Rollout

No migration required. No DB schema changes. No API contract changes. Feature flag not needed — changes are backward compatible (default props, idempotent registry, fallback UI).

Rollout: Single PR to `development` → `staging` → `main`. No phased rollout needed.

## Open Questions

- [ ] Safari `::-webkit-calendar-picker-indicator` filter ignored — accept manual verification gap or add JS-based custom picker (out of scope)?
- [ ] Light theme `--schedule-day-active-bg` at 0.12: verify exact contrast ratio with `--text-main` (#0f172a) on tinted background. May need 0.10 if 0.12 fails AA.
- [ ] Should `ConfigTabFallback` redirect automatically or stay as link? Spec says "visible message + link" — confirm with PO.

---

**Design persisted to**: `openspec/changes/review-config-doctors/design.md`