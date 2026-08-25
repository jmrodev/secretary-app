# Delta for css-modules-compliance

## ADDED Requirements
### REQ-1 (Compliance)
No JSX file in client/src may use a global BEM class as a raw string className for: config-section, config-section__*, config-grid, config-grid--*, tab-panel, action-bar, action-bar__*, search-box__*, user-table__header, text-danger, animate-fade-in.

### REQ-2 (Shared module)
client/src/styles/shared.module.css MUST export PascalCase BEM class names (Block__element--modifier) for all the above (e.g. ConfigSection, ConfigSection__header, ConfigGrid, ConfigGrid--2col, TabPanel, ActionBar, ActionBar__search, SearchBox__wrapper, SearchBox__icon, SearchBox__input, UserTable__header, TextDanger, AnimateFadeIn). Per client/.stylelintrc.json the names must be PascalCase BEM; camelCase or lowercase class names fail lint.

### REQ-3 (Global cleanup)
Global stylesheets (components.css, utilities.css, layout-dashboard.css) MUST NOT define the migrated BEM classes after conversion.

### NFR-1 (Visual parity)
Rendered UI must be visually identical; only className resolution changes.
### NFR-2 (GGA)
GGA pre-commit must pass on all touched files.

## Scenarios
- SC-1: After change, GGA pre-commit passes on every modified file.
- SC-2: Visual diff of a config section shows no layout/style change.
