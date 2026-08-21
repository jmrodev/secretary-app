# Design: css-modules-compliance

## Dependency on frontend-style-unification
The archived change frontend-style-unification (2026-08-18, PRs #359-#369) installed client/.stylelintrc.json with plugin/selector-bem-pattern at error and implicitComponents: "**/*.module.css". That rule applies ONLY inside *.module.css files. It did NOT touch global stylesheets nor the JSX that imports those global classes as raw strings. This change closes exactly that gap. The new shared module IS a *.module.css, so it MUST follow the same PascalCase BEM convention (.ConfigSection, not .config-section and not camelCase .configSection).

## Technical Approach
Create one shared CSS module and convert JSX usages.

### Decision D1 — Shared module (PascalCase BEM, mandatory)
Create client/src/styles/shared.module.css. Export PascalCase BEM class names:
- ConfigSection, ConfigSection__header, ConfigSection__icon, ConfigSection__title, ConfigSection__desc, ConfigSection__body, ConfigSection__divider
- ConfigGrid, ConfigGrid--2col, ConfigGrid--gap1
- TabPanel
- ActionBar, ActionBar__search, ActionBar__tools
- SearchBox__wrapper, SearchBox__icon, SearchBox__input, SearchBox__suggestionIcon, SearchBox__suggestionStatus
- UserTable__header
- TextDanger
- AnimateFadeIn

Move the exact CSS rules from the global stylesheets into it, keeping token references from variables.css.

### Decision D2 — Import pattern
In each component: `import shared from '@/styles/shared.module.css';`
- `className="config-section"` -> `className={shared.ConfigSection}`
- combined: `className={\`${styles.X} animate-fade-in\`}` -> `className={\`${styles.X} ${shared.AnimateFadeIn}\`}`

### Decision D3 — Global stylesheet cleanup (full-repo scope)
After ALL usages are converted, delete the migrated rules from components.css (L45-100), utilities.css (.config-grid, .config-grid--3col, .animate-fade-in, .text-danger), layout-dashboard.css (.animate-fade-in).

### Decision D4 — Unknown global classes
tab-panel, action-bar, search-box*, user-table__header are referenced in JSX but not defined in client/src/styles/*.css. Define them in shared.module.css (carry effective styles if found elsewhere, else minimal token-based).

## Architecture
No new runtime modules; purely styling/class-resolution change. Components already using CSS Modules keep local styles; shared provides the cross-cutting classes and complies with the established BEM stylelint rule.
