# Tasks: review-config-doctors

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~60 (design est. 40-60; 7 files: 3 CSS, 3 JSX/JS, 1 fallback) |
| 400-line budget risk | Low |
| Review budget (session) | 1000 lines |
| Chained PRs recommended | No |
| Suggested split | Single PR (no chain) |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Schedule contrast + Input color-scheme + defensive setSchedule + registry idempotency + unknown-tab fallback | PR 1 (single) | `pnpm --filter client test -- DoctorScheduleSettings.guard configRegistry SystemConfigPage` | Manual: `/config?tab=billing`, `/config?tab=unknown`, billing->fiscal->schedule tab switch, dark/dim/light theme visual | Revert 7 files: `variables.css`, `DoctorScheduleSettings.*`, `Input.module.css`, `BillingSettings.jsx`, `SystemConfigPage.jsx`, `configRegistry.js` |

## Phase 1: Foundation — Defensive Guards (TDD RED)

- [ ] 1.1 RED: Failing Vitest mount `DoctorScheduleSettings` without `setSchedule`, toggle day/edit block no throw (`schedule-accessibility` Req 3, `DoctorScheduleSettings.jsx`) — verify: `pnpm --filter client test` RED
- [ ] 1.2 RED: Failing Vitest `registerConfigSection('billing',...)` twice → `getConfigSections().length===1` (`config-unknown-tab-fallback` Req 1, `configRegistry.js`) — verify: Vitest RED
- [ ] 1.3 RED: Failing Vitest `SystemConfigPage` with `?tab=unknown` renders "Tab not found" (`config-unknown-tab-fallback` Req 1, `SystemConfigPage.jsx`) — verify: Vitest RED

## Phase 2: Core Implementation (TDD GREEN)

- [ ] 2.1 Add `setSchedule = () => {}` default in `DoctorScheduleSettings.jsx:27` (`schedule-accessibility` Req 3) — passes 1.1 — verify: `pnpm --filter client test -- DoctorScheduleSettings.guard`
- [ ] 2.2 Add `if (registry.has(id)) return;` in `configRegistry.js:registerConfigSection` (`config-unknown-tab-fallback` Req 1) — passes 1.2 — verify: `pnpm --filter client test -- configRegistry`
- [ ] 2.3 Update `variables.css` `--schedule-day-active-bg` dark/dim 0.10→0.16 light 0.10→0.12 + active border 2px (`schedule-accessibility` Req 1) — verify: manual visual ΔL≥10, WCAG AA
- [ ] 2.4 Remove `opacity:0.75` and set active border 2px in `DoctorScheduleSettings.module.css:37-51` (`schedule-accessibility` Req 1) — verify: manual visual distinct
- [ ] 2.5 Add `color-scheme: dark/light` + `::-webkit-calendar-picker-indicator {filter:invert(0.7)}` scoped dark/dim in `Input.module.css` (`schedule-accessibility` Req 2) — verify: manual Chrome/Firefox/Safari picker
- [ ] 2.6 Pass `schedule:[], setSchedule:()=>{}, loadingSchedule:false` in `BillingSettings.jsx:handleEditDoctorFiscal` (`billing-config` Req) — verify: billing→schedule tab no throw
- [ ] 2.7 Replace `if (!section) return null` with `ConfigTabFallback` in `SystemConfigPage.jsx:24` (`config-unknown-tab-fallback` Req 1) — passes 1.3 — verify: Vitest + manual `/config?tab=unknown`

## Phase 3: Verification & Regression

- [ ] 3.1 Run new tests GREEN `pnpm --filter client test -- DoctorScheduleSettings.guard configRegistry SystemConfigPage` (strict TDD)
- [ ] 3.2 Manual theme check: active/inactive contrast + time icon visibility in dark/dim/light (`schedule-accessibility` Req 1,2) — verify: visual pass
- [ ] 3.3 Manual integration: `/config?tab=billing` OK for admin/secretary, `?tab=unknown` fallback, billing modal→schedule no crash (`billing-config`, `config-unknown-tab-fallback`)
- [ ] 3.4 Confirm `POST /settings` secretary 200 / doctor 403 unchanged (`config-role-access` Req, no code change) — verify: `pnpm --filter server test`

## Phase 4: Cleanup

- [ ] 4.1 Lint `pnpm lint`, remove temp scaffolding, no hardcoded colors — verify: `pnpm lint` clean
