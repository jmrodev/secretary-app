# Proposal: review-config-doctors

## Intent

Comprehensive review and targeted hardening of the Config section (billing, secretary permissions, granular access) and Doctor Management (schedule UI contrast, latent edge cases). The user reported: schedule days invisible in dark/dim themes, `setSchedule is not a function` crash risk, `/config?tab=billing` "not working", and secretary save permission confusion. Exploration confirmed 5 distinct areas with evidence — this proposal documents all findings and proposes minimal, low-risk fixes for the reported pain points.

## Scope

### In Scope
- **Schedule day active/inactive contrast** (dark/dim): raise `--schedule-day-active-bg` to `rgba(var(--primary-rgb),0.16)`, increase active border to 2px, drop inactive `opacity:0.75` to 1 (or raise inactive bg), ensure `ScheduleTimeBlock` container uses dedicated token.
- **Native time input dark-mode visibility**: add `color-scheme: dark` + `::-webkit-calendar-picker-indicator { filter: invert(0.7) }` scoped to `data-theme="dark|dim"` in `Input` atom.
- **Defensive `setSchedule` guard**: add `setSchedule = () => {}` default param in `DoctorScheduleSettings`; ensure `BillingSettings` passes schedule props or prevents schedule tab switch when launching `DoctorEditModal`.
- **Unknown-tab fallback**: replace `return null` with explicit "Tab not found" UI in `SystemConfigPage`; add idempotency guard to `configRegistry.registerConfigSection`.
- **Document secretary save permission**: confirm `POST /settings` allowed for `MANAGE_CORE_DATA` (secretary) — no code change, but explicit in spec.

### Out of Scope
- Full `DoctorEditModal.module.css` token migration (hardcoded `rgb(...)`, `var(--slate-*)`) — follow-up `css-schedule-tab-remediation` phase 2.
- `ScheduleTimeBlock` container tokenization (`--schedule-block-bg`, `--schedule-block-border`) — follow-up.
- `billing→schedule` integration tests — follow-up.
- `reset_admin.js` weak password hazard — operational fix (env-guard or delete), not in this PR.
- Granular permission changes — `MANAGE_CORE_DATA` coarse role check is intentional per archived decisions.

## Capabilities

### New Capabilities
- `schedule-accessibility`: Schedule day active state contrast and native time input visibility across light/dim/dark themes (WCAG AA target).
- `config-unknown-tab-fallback`: Explicit empty/error state for unregistered or unauthorized config tabs.

### Modified Capabilities
- `config-role-access`: Add scenario for unknown tab fallback (was implicit `null` return).
- `billing-config`: Add scenario for `DoctorEditModal` launched from billing tab — schedule props present or schedule tab disabled.

## Approach

**Approach 1 (Minimal hotfix + hardening)** per exploration recommendation. Targeted CSS token adjustments (~15 lines in `variables.css`, `DoctorScheduleSettings.module.css`, `Input.module.css`), defensive JS guards (~5 lines in `DoctorScheduleSettings.jsx`, `BillingSettings.jsx`, `SystemConfigPage.jsx`, `configRegistry.js`). Total ~40-60 changed lines, single PR, low regression risk. Follow-up ticket for Approach 2 (token-complete remediation).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/src/styles/variables.css:194-209,247-262,294-309` | Modified | Raise `--schedule-day-active-bg` opacity (dark/dim 0.10→0.16, light 0.08→0.12), keep border/semantic tokens |
| `client/src/features/doctors/components/sections/DoctorScheduleSettings.module.css:37-51,63-68` | Modified | Drop inactive `opacity:0.75`, ensure active border 2px, name color contrast |
| `client/src/components/atoms/Input.module.css:1-28` | Modified | Add `color-scheme: dark/light` + picker indicator filter for `data-theme="dark|dim"` |
| `client/src/features/doctors/components/sections/DoctorScheduleSettings.jsx:24-47` | Modified | Add `setSchedule = () => {}` default, guard calls |
| `client/src/features/config/components/sections/BillingSettings.jsx:272-285` | Modified | Pass schedule props or disable schedule tab when launching `DoctorEditModal` |
| `client/src/features/config/SystemConfigPage.jsx:20-46` | Modified | Replace `if (!section) return null` with explicit fallback UI |
| `client/src/features/config/registry/configRegistry.js` | Modified | Add idempotency guard to `registerConfigSection` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Raising active bg opacity washes out text in light theme | Medium | Verify `--text-main` contrast per theme; keep light theme increase smaller (0.12) |
| `color-scheme` on `Input` affects all `type=time/date` app-wide | Medium | Test appointments, rentals, holidays pages in all 3 themes + Safari |
| Optimistic `updateSetting` masks 403 as silent revert | Medium | Follow-up: add toast on catch with server message (out of scope) |
| `reset_admin.js` with `admin123` credential hazard | Low | Separate operational fix: env-guard or delete script |
| Registry `Map` duplicates on HMR/StrictMode | Low | Add early-return guard `if (registry.has(id)) return` |

## Rollback Plan

Revert CSS token changes in `variables.css` and component modules. Remove defensive defaults in `DoctorScheduleSettings.jsx` and `BillingSettings.jsx`. Revert `SystemConfigPage.jsx` to `return null`. Remove idempotency guard in `configRegistry.js`. All changes are isolated, no DB migrations, no API contract changes.

## Dependencies

- None (self-contained frontend changes). Server config/permissions unchanged.

## Success Criteria

- [ ] Schedule day active state visually distinct from inactive in dark/dim (manual verify: ΔL ≥ 10, border 2px teal visible)
- [ ] Time input clock icon visible in dark/dim themes (Chromium + Firefox + Safari)
- [ ] `DoctorScheduleSettings` renders without `setSchedule` prop → no TypeError
- [ ] `BillingSettings` → `DoctorEditModal` (fiscal tab) → schedule tab switch → no crash
- [ ] `/config?tab=unknown` renders "Tab not found" message, not blank
- [ ] HMR double-register does not duplicate config sections
- [ ] Secretary role can save `afip_environment` via `POST /settings` (unchanged, verified)

---
*Proposal based on exploration.md evidence (file:line citations throughout).*