# Proposal: Architecture Compliance Fixes

## Intent

Fix 24+ CSS/design-token violations across 5 settings sections (General, Modules, Communications, Integrations, Billing) and 3 sub-modules that violate ARQUITECTURA.md §2 and AGENTS.md §2.1/2.2. Inline styles bypass design system, undefined tokens break theme switching, dead code confuses maintenance.

## Scope

### In Scope

- Extract 11 inline `style={{}}` blocks → CSS Modules (BEM) across BillingSettings.jsx, IntegrationRemoteAccess.jsx, IntegrationMetaWhatsApp.jsx
- Token swaps in 2 CSS Modules: replace 7 non-semantic/undefined tokens (--white, --green-500, --slate-*, etc.) with defined semantic tokens (--card-surface-bg, --success, --gray-*, --error)
- Convert 2 hardcoded RGB values → `rgb(var(--primary-rgb)/10%)`
- Fix 4 BEM bypasses via `variant="monospace"` prop on ConfigField/Input atoms
- Wire orphan `IntegrationRemoteAccess.module.css`; delete or wire `BillingSettings.module.css`

### Out of Scope

- Global CSS consolidation or lint rule creation
- Test authoring (separate follow-up)
- Refactoring unrelated components
- New features or behavior changes

## Approach

Minimal extraction + semantic swap (Approach 1). Fix all violations in-place without global refactor. Single PR covering all 5 sections + 3 sub-modules. Estimated <400 lines diff (~120-200 LOC).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/src/features/config/components/sections/BillingSettings.jsx` | Modified | Extract 4 inline styles to CSS Module, fix CSR box tokens |
| `client/src/features/config/components/sections/IntegrationRemoteAccess.jsx` | Modified | Extract 8 inline styles + icon wrapper, wire CSS Module |
| `client/src/features/config/components/sections/IntegrationMetaWhatsApp.jsx` | Modified | Extract config-actions inline style |
| `client/src/features/config/components/sections/BillingSettings.module.css` | Modified/Removed | Token swaps or deletion if unused |
| `client/src/features/config/components/sections/IntegrationRemoteAccess.module.css` | Modified | Wire classes, token swaps |
| `client/src/features/config/components/atoms/ConfigField.jsx` | Modified | Add `variant="monospace"` prop |
| `client/src/features/config/components/atoms/Input.jsx` | Modified | Add `monospace` prop support |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Theme regression in dark/light/dim | Medium | Manual visual check across 3 themes before merge |
| BEM class name conflicts | Low | Use scoped CSS Modules, follow existing naming |
| Orphan module deletion breaks unknown import | Low | Grep for imports before deletion |

## Rollback Plan

Revert single PR. All changes are additive (new CSS classes) or token swaps with semantic equivalents — no behavioral logic changes.

## Dependencies

- Design tokens defined in `client/src/styles/variables.css` must exist (--card-surface-bg, --success, --error, --gray-*, --primary-rgb)

## Success Criteria

- [ ] Zero inline `style={{}}` in target 3 files
- [ ] Zero undefined/non-semantic tokens in target 2 CSS Modules
- [ ] Zero hardcoded RGB values (all use `rgb(var(--primary-rgb)/10%)`)
- [ ] Zero raw class strings on atoms (all use variant props)
- [ ] `IntegrationRemoteAccess.module.css` imported and used
- [ ] `BillingSettings.module.css` either wired or deleted
- [ ] Visual parity verified across dark/light/dim themes