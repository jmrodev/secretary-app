# Delta for Frontend Style Unification

## Context

Developer-facing quality contract for `client/` (React 19, CSS Modules, Atomic Design). Pure technical refactor; no product-behavior change. Phase 1 (purge of orphaned 1-line `.module.css`) shipped in PR #343 — zero orphans remain. This delta covers Phases 2–5.

> DECISION: the proposal's In-Scope item "enforce `t()` for visible text; allow inline styles only for dynamic values" (success criterion "no visible text outside `t()`") is **postponed to a separate change** (user-confirmed 2026-08-14). This delta covers only named-exports and BEM enforcement.

## ADDED Requirements

### Requirement: ESLint named-exports gate

The client ESLint config SHALL add a `no-restricted-syntax` selector for `ExportDefaultDeclaration` directing to named exports. The rule SHALL be `warn` during migration (Phases 2–4) and `error` in Phase 5. A `warn` rule MUST NOT fail `pnpm lint` or `pnpm build`.

#### Scenario: Warning during migration does not break the build

- GIVEN the `ExportDefaultDeclaration` selector is `warn`
- WHEN `pnpm lint` runs on a feature still using `export default`
- THEN eslint warns, naming the file and line
- AND `pnpm build` succeeds

#### Scenario: Error-level rule blocks default exports

- GIVEN the rule is `error` (Phase 5)
- WHEN `pnpm lint` runs and any client file declares `export default`
- THEN eslint exits non-zero

### Requirement: BEM enforcement via stylelint

The client stylelint config SHALL configure the existing `stylelint-selector-bem-pattern` plugin with `componentName`/`componentSelectors` to enforce `block__element--modifier`. The rule SHALL be `warn` during migration and `error` in Phase 5.

#### Scenario: Flat class flagged on a non-migrated module

- GIVEN the BEM plugin is configured in `.stylelintrc.json`
- WHEN a non-migrated `.module.css` declares a flat class (e.g. `container`)
- THEN stylelint reports a BEM violation as warning
- AND `pnpm lint` exits 0

#### Scenario: BEM-compliant module passes

- GIVEN a module whose classes all match `block__element--modifier`
- WHEN `pnpm lint` runs
- THEN no BEM violations are reported

### Requirement: Named-exports migration

Every client JSX/JS component file SHALL use named exports (`export const` / `export function`). When an export is renamed, ALL importers MUST be updated in the same PR. After migration, `rg "export default" client/src/features` MUST return zero matches and no dangling default imports MAY remain.

#### Scenario: Feature migrated end-to-end

- GIVEN a feature whose components use `export default`
- WHEN the feature is migrated and every importer updated
- THEN `rg "export default" client/src/features/<feature>` returns no matches
- AND `pnpm lint` and `pnpm build` pass

#### Scenario: Mixed component/hook file

- GIVEN a file exporting a component plus hooks (e.g. `useAuth`)
- WHEN migrated to named exports
- THEN hooks stay valid under `react-refresh/only-export-components`
- AND the component is imported by name at every usage site

### Requirement: BEM class naming in migrated features

CSS module classes in migrated features SHALL use `block__element--modifier` naming, and JSX `styles.*` references SHALL be updated in the same PR.

#### Scenario: Flat class normalized

- GIVEN a `.module.css` in a migrated feature declares a flat class (e.g. `container`)
- WHEN normalized to `block__element` form
- THEN all `styles.container` JSX usages are renamed
- AND `pnpm lint` and `pnpm build` pass

#### Scenario: Modifier classes

- GIVEN a state-dependent class (e.g. `active`, `disabled`)
- WHEN normalized
- THEN it becomes `block__element--modifier`
- AND a BEM regex check over the module matches every selector

### Requirement: Final verification gate

The named-exports and BEM rules SHALL be `error` in Phase 5. Full-repo `pnpm lint` and `pnpm build` SHALL pass with exit code 0. No orphaned 1-line `.module.css` files MUST remain; each remaining one MUST be imported and referenced via `styles.`.

#### Scenario: Full-repo gate passes

- GIVEN all features migrated and BEM-normalized, rules at `error`
- WHEN full-repo `pnpm lint` runs
- THEN the exit code is 0
- AND `pnpm build` succeeds

#### Scenario: Regression fails the gate

- GIVEN a new `export default` or flat class is introduced
- WHEN `pnpm lint` runs
- THEN eslint/stylelint exit non-zero and block the PR

#### Scenario: Orphan verification

- GIVEN the final state of `client/src`
- WHEN each 1-line `.module.css` is checked with `rg` for its import and `styles.` usage
- THEN every 1-line module is imported and referenced, or removed