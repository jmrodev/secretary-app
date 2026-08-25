# Tasks: Architecture Compliance Fixes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150–220 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR (7 files) |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | CSS Modules foundation | PR 1 | `grep -E "slate-|rgb\(13" *.module.css` empty; `pnpm lint` | N/A — static CSS, grep+lint suffice | `BillingSettings.module.css`, `IntegrationRemoteAccess.module.css`, `ModulesSettings.module.css` |
| 2 | JSX inline extraction + monospace variants | PR 1 | `grep -r "style={{" sections/` empty; `grep -r "config-field__input--monospace" sections/` empty | `pnpm --filter client dev` → /config smoke | 4 JSX files — revert Unit 2 |
| 3 | Verification (themes, compliance, build) | PR 1 | `pnpm lint && pnpm --filter server test` + 3 grep gates | `pnpm dev` dark/light/dim on /config | No files — verification only |

## Phase 1: CSS Module Creation/Wiring (Foundation)

- [ ] 1.1 Replace `BillingSettings.module.css` — 7 BEM classes: `__csrBox`, `__csrTextarea`, `__actionsRight`, `__status`, `__statusSuccess`, `__statusError`, `__statusHeader` (semantic tokens)
- [ ] 1.2 Wire `IntegrationRemoteAccess.module.css` — 8 BEM classes: `__mobileCard`, `__mobileInfo`, `__mobileIcon`, `__mobileTitle`, `__mobileDesc`, `__urlDisplay`, `__actions`, `__configActions` + responsive @media; use `rgb(var(--primary-rgb)/10%)`
- [ ] 1.3 Fix `ModulesSettings.module.css:49` — `rgb(13 148 136 / 10%)` → `rgb(var(--primary-rgb) / 10%)`

## Phase 2: JSX Inline Style Extraction (Core)

- [ ] 2.1 `BillingSettings.jsx` — import styles, replace CSR box (168-173)→`__csrBox`, actions flex (187)→`__actionsRight`, textarea→`ConfigField variant="monospace"`+`__csrTextarea`, status→new BEM; no `style={{`
- [ ] 2.2 `IntegrationRemoteAccess.jsx` — import styles, replace mobile card (131-140)→`__mobileCard`, icon (142-151)→`__mobileIcon` (drop hardcoded RGB), info/title/desc→`__mobile*`, url (113)→`__urlDisplay`, actions→`__actions`/`__configActions`; no `style={{`
- [ ] 2.3 `IntegrationMetaWhatsApp.jsx` — actions inline (46)→`.config-actions`, Phone ID (24-32) + Token (34-43)→`variant="monospace"`; no `style={{`, no raw monospace
- [ ] 2.4 `IntegrationGoogleCalendar.jsx` — Spreadsheet ID (89-105)→`ConfigField variant="monospace"`; no raw monospace

## Phase 3: Verification & Cleanup

- [ ] 3.1 Compliance gates — `grep -r "style={{" sections/`, `grep -E "slate-|rgb\(13" *.module.css`, `grep -r "config-field__input--monospace" sections/` all empty (AC-1/2/3)
- [ ] 3.2 Theme parity — `pnpm dev` → /config → check General/Modules/Communications/Integrations×3/Billing in dark/light/dim; no regressions
- [ ] 3.3 Lint & build — `pnpm lint` + `pnpm build` + `pnpm --filter server test`; zero new errors, bundle <1KB delta