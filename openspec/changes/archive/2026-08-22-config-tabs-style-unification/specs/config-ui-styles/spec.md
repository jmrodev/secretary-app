# Delta Specification: Configuration Tabs Style Unification

## Context
Standardize CSS modules, BEM class naming conventions, and design token compliance across all configuration components (`ConfigField`, `ConfigToggle`, `MessageTemplateEditor`, `IntegrationRemoteAccess`, `BillingSettings`).

## ADDED Requirements

### Requirement: Design Token Adherence
All configuration CSS modules MUST strictly consume CSS custom properties (design tokens) for colors, radii, spacing, and shadows (`--color-*`, `--radius-*`, `--spacing-*`, `--card-surface-bg`, etc.). Hardcoded hex, rgb/rgba, or pixel-based radius/spacing values MUST NOT be used in targeted stylesheets.

#### Scenario: Stylesheet token compliance
- GIVEN any configuration CSS module (`ConfigField`, `ConfigToggle`, `MessageTemplateEditor`, `IntegrationRemoteAccess`, `BillingSettings`)
- WHEN the CSS stylesheet is parsed and inspected
- THEN zero hardcoded color or radius values are present
- AND all layout dimensions and colors derive from defined theme variables.

### Requirement: ConfigField and ConfigToggle CSS Module Encapsulation
[`ConfigField`](file:///home/jmro/secretary-app/src/components/common/ConfigField.jsx) and [`ConfigToggle`](file:///home/jmro/secretary-app/src/components/common/ConfigToggle.jsx) MUST encapsulate styles using CSS Modules (`ConfigField.module.css` and `ConfigToggle.module.css`) and strictly follow BEM naming conventions (`Block__element--modifier`).

#### Scenario: ConfigToggle renders with encapsulated BEM classes
- GIVEN a `ConfigToggle` component rendered in any configuration view
- WHEN checking the rendered DOM element classes
- THEN styles are applied via scoped CSS Module classes matching the BEM pattern `ConfigToggle__*`
- AND state modifiers (e.g., active, disabled) are applied via modifier classes.

#### Scenario: ConfigField maintains standard BEM layout
- GIVEN a `ConfigField` component wrapping input controls
- WHEN rendered with labels, helpers, or error messages
- THEN elements are styled using `ConfigField__label`, `ConfigField__input`, `ConfigField__helper`, and `ConfigField__error` classes sourced from its CSS module.

### Requirement: Integration Remote Access Guide Styling
[`IntegrationRemoteAccess.module.css`](file:///home/jmro/secretary-app/src/components/Config/IntegrationRemoteAccess.module.css) MUST provide full BEM styling (`IntegrationRemoteAccess__guide*`) using design tokens for step-by-step setup guides and remote connection documentation.

#### Scenario: Remote access setup guide rendering
- GIVEN a user views the Remote Access integration settings tab
- WHEN the setup guide section is displayed
- THEN guide containers, steps, code snippets, and callouts render with consistent tokenized styling across light, dim, and dark themes.

### Requirement: Multi-Theme Responsiveness and Contrast
All configuration tabs MUST adapt seamlessly across light, dim, and dark themes without visual regressions, illegible text, or broken border contrasts.

#### Scenario: Theme switching across configuration tabs
- GIVEN a user toggles the application theme between light, dim, and dark
- WHEN inspecting any configuration tab (`ModulesSettings`, `CommunicationSettings`, `MessageTemplateEditor`, `IntegrationSettings`, `BillingSettings`)
- THEN background surfaces, input fields, toggles, text contrast, and borders adapt dynamically without hardcoded overrides.
