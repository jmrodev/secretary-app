# Archive Report: Architecture Compliance Fixes

**Change**: `architecture-compliance-fixes`
**Status**: COMPLETED
**Date**: 2026-08-21
**Artifact Store**: OpenSpec (`openspec/changes/architecture-compliance-fixes/`)

## Summary

Successfully fixed 24+ CSS/design-token violations across 5 settings sections and 3 sub-modules, bringing the codebase into full compliance with ARQUITECTURA.md §2 and AGENTS.md §2.1/2.2.

## What Was Fixed

| Category | Count | Details |
|----------|-------|---------|
| Inline styles extracted | 11 | Across BillingSettings (3), IntegrationRemoteAccess (8), IntegrationMetaWhatsApp (1) |
| Non-semantic tokens swapped | 7 | `--white`→`--card-surface-bg`, `--green-500/700`→`--success`, `--red-700`→`--error`, `--slate-50/200`→`--gray-50/--border-color`/`--card-surface-bg` |
| Hardcoded RGB converted | 2 | `rgb(13 148 136 / 10%)` → `rgb(var(--primary-rgb) / 10%)` |
| BEM bypasses fixed | 4 | Raw `config-field__input--monospace` → `variant="monospace"` on ConfigField |
| Orphan modules resolved | 2 | BillingSettings.module.css (replaced), IntegrationRemoteAccess.module.css (wired) |

## Files Modified (8 total)

1. `client/src/features/config/components/sections/BillingSettings.jsx` — Inline styles extracted, monospace variant, status BEM classes
2. `client/src/features/config/components/sections/BillingSettings.module.css` — Replaced with 7 minimal BEM classes using semantic tokens
3. `client/src/features/config/components/sections/IntegrationRemoteAccess.jsx` — 8 inline styles extracted, module wired
4. `client/src/features/config/components/sections/IntegrationRemoteAccess.module.css` — Populated with 8 BEM classes + responsive @media
5. `client/src/features/config/components/sections/ModulesSettings.module.css` — Line 49: hardcoded RGB → semantic token
6. `client/src/features/config/components/sections/IntegrationMetaWhatsApp.jsx` — Inline config-actions removed, 2 monospace variants
7. `client/src/features/config/components/sections/IntegrationGoogleCalendar.jsx` — 1 monospace variant
8. `client/src/features/config/components/ui/ConfigField.jsx` — Prop forwarding for `readOnly`, `rows`, `...rest`

## Verification Results

| Gate | Result |
|------|--------|
| AC-1: No inline styles | ✅ PASS |
| AC-2: No bad tokens | ✅ PASS |
| AC-3: No raw monospace class | ✅ PASS |
| AC-4: BillingSettings.module.css exists | ✅ PASS |
| AC-5: IntegrationRemoteAccess.module.css exists | ✅ PASS |
| AC-7: BEM naming consistent | ✅ PASS |
| Lint (CSS + JS/TS) | ✅ PASS |
| Build | ✅ PASS |
| Server tests (211 tests) | ✅ PASS |

## Manual Verification Required

- **AC-6**: Visual parity across dark/light/dim themes — run `pnpm dev`, navigate to `/config`, verify each tab

## Compliance Achieved

- **ARQUITECTURA.md §2**: CSS Modules, BEM, Design Tokens, No inline styles, i18n — ALL COMPLIANT
- **AGENTS.md §2.1/2.2**: Design tokens obligatory, spacing scale, mobile-first layout — ALL COMPLIANT

## Rollback

Revert the single PR. All changes are additive or token swaps — no behavioral logic changes.

## Related

- Exploration: engram `sdd/architecture-compliance-fixes/explore` (#118)
- Proposal: engram `sdd/architecture-compliance-fixes/proposal` (#119)
- Spec: engram `sdd/architecture-compliance-fixes/spec` (#120)
- Design: engram `sdd/architecture-compliance-fixes/design` (#121)
- Tasks: engram `sdd/architecture-compliance-fixes/tasks` (#122)
- Verify: `openspec/changes/architecture-compliance-fixes/verify-report.md`