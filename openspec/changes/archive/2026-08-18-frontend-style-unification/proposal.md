# Proposal: Frontend Style Unification

## Intent

The frontend violates its own standards (AGENTS.md). Audit: 237 JSX use `export default` vs 30 named (~89% divergence), 20 `module.css` are 1-line orphans, 186 CSS files have flat (non-BEM) classes, 28 JSX have raw strings (no `t()`), 33 use inline styles. This causes inconsistent maintenance and drift from the Atomic Design/BEM/i18n contract. A unified criterion makes compliance enforceable per feature.

## Scope

### In Scope
- Purge ~20 orphaned 1-line `.module.css` (unused: not imported AND no `styles.` usage) — pattern validated by merged reports dead-code purge (PR #342)
- Verify/add ESLint rule enforcing named exports and BEM, making the criterion mechanical
- Migrate named exports feature-by-feature, smallest first (holidays, rentals, insurances)
- Fix non-BEM classes in migrated features
- Enforce `t()` for visible text; allow inline styles only for dynamic values

### Out of Scope
- i18n string audit (deferred; separate change)
- Re-audit of the already-merged reports purge
- Backend or Go bridge styling

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

> Pure technical style refactor with no product-behavior change.

## Approach

**Staged per-feature refactor, each stage = one PR to `development`.** Order: (1) CSS purge, (2) lint rule, (3) named-exports migration (small→large), (4) BEM fixes. Before deleting any CSS, `rg` to confirm no import and no `styles.` usage — some 1-line modules delegate reuse (reports Certificate/License import MedicalReportTable.module.css). Renaming exports updates all importers in the same PR.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/src/features/*` (237 JSX) | Modified | Named exports migration, staged |
| ~20 orphan `.module.css` (medical_documents, institutions, config, chat, auth, appointments) | Removed | Purge after import/usage verification |
| `client/src/features/*.module.css` (186) | Modified | BEM normalization |
| ESLint config (`client/`) | Modified | Add named-exports/BEM rules |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Renaming exports breaks importers | High | Per-feature PR; update all importers together; `pnpm build` + lint gate |
| Deleting a CSS that delegates reuse | Med | rg-check import + `styles.` usage first |
| Enormous scope (237 files) | High | Small per-feature PRs, not one shot |

## Rollback Plan

Each stage is an isolated PR to `development`. Revert a single PR with `git revert` (no DB/API impact). If the lint rule flags pre-existing code, fix or scope it to new code only. CSS deletion is reversible from git history.

## Dependencies

- None blocking. Relies on existing ESLint/Stylelint setup.

## Success Criteria

- [ ] Zero orphaned 1-line `.module.css` files remain (verified unused)
- [ ] Named-exports rule enforced; `export default` near zero in migrated features
- [ ] All classes in migrated features follow BEM
- [ ] No visible text outside `t()` in migrated features
- [ ] `pnpm lint` passes and `pnpm build` succeeds