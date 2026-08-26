# Apply Progress: review-config-doctors

- **Change**: review-config-doctors
- **Status**: Complete (all 4 phases)
- **Applied by**: orchestrator (inline) — `sdd-apply` sub-agent transport-failed on the free model.

## Tasks completed

| Phase | Task | Status |
|-------|------|--------|
| 1 | RED tests: setSchedule guard, registry idempotency, unknown-tab fallback | ✅ (1.1 already GREEN via css-schedule-tab-remediation guard) |
| 2.1 | `setSchedule` no-op default | ✅ (implemented earlier as `setScheduleSafe` guard in css remediation) |
| 2.2 | `configRegistry.registerConfigSection` idempotency guard | ✅ |
| 2.3 | `--schedule-day-active-bg` 0.10→0.16 (dark/dim), 0.12 (light) | ✅ |
| 2.4 | Remove `opacity:0.75` inactive; 2px active border | ✅ |
| 2.5 | `Input.module.css` `color-scheme` + picker invert (dark/dim) | ✅ |
| 2.6 | `BillingSettings.handleEditDoctorFiscal` passes `schedule/setSchedule/loadingSchedule` | ✅ |
| 2.7 | `SystemConfigPage` unknown-tab `ConfigTabFallback` | ✅ |
| 3 | Verify & regression (tests, lint, server) | ✅ |
| 4 | Lint clean (0 errors), no temp scaffolding | ✅ |

## Notes

- The `setSchedule` defensive default (task 2.1 / RED 1.1) was implemented during the
  `css-schedule-tab-remediation` change as a `setScheduleSafe` wrapper (useMemo-guarded).
  It satisfies this change's requirement; no duplicate default param added.
- `color-scheme` / picker-invert rules required `/* stylelint-disable plugin/selector-bem-pattern */`
  because the BEM linter rejects attribute/element selectors; they are scoped by `[data-theme]`
  and documented as intentional.
- New fallback classes follow the file's BEM block (`SystemConfigPage__configTabFallback*`).

## Files changed

- `client/src/styles/variables.css` (active-bg alpha + `rgb()` modern notation)
- `client/src/features/doctors/components/sections/DoctorScheduleSettings.module.css`
- `client/src/components/atoms/Input.module.css`
- `client/src/features/config/registry/configRegistry.js`
- `client/src/features/config/SystemConfigPage.jsx` (+ exported `SettingsContent`, `ConfigTabFallback`)
- `client/src/features/config/SystemConfigPage.module.css`
- `client/src/features/config/components/sections/BillingSettings.jsx`
- `client/src/constants/languages/{es,en}/general.js` (`config_tab_not_found`, `config_tab_redirect`)
- `client/src/features/config/registry/configRegistry.test.js` (new)
- `client/src/features/config/SystemConfigPage.test.jsx` (new)
