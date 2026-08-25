# Proposal: css-modules-compliance

## Intent
Bring the codebase into compliance with docs/ARQUITECTURA.md §2 by eliminating global BEM string classNames and migrating them to a shared CSS module.

## Scope
- Create client/src/styles/shared.module.css with the shared design-system classes (PascalCase BEM).
- Convert every JSX file that uses the global classes (config-section*, config-grid*, tab-panel, action-bar, search-box*, user-table__header, text-danger, animate-fade-in) to import and use the shared module.
- Remove the migrated BEM rules from global stylesheets (components.css, utilities.css, layout-dashboard.css).

## Non-Goals
- No runtime/behavior change.
- No design-token or hardcoded-value changes (keep variables.css tokens).
- Feature logic untouched.

## Risks
- Diff exceeds 400 lines -> split into chained PRs (decided: auto-chain / feature-branch-chain, full-repo scope).
- Requires visual QA to confirm no regression.
