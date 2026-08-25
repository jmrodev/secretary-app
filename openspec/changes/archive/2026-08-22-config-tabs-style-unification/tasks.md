<!-- Review Workload Forecast: ~180 LOC across 8 files | Estimated Review Time: 12-15 minutes -->
# Implementation Tasks: Config Tabs Style Unification

## Phase 1: Shared UI Controls Refactor
- [x] 1.1 Update [ConfigField.module.css](file:///home/jmro/secretary-app/client/src/features/config/components/ui/ConfigField.module.css) to add `.ConfigField__input`, `.ConfigField--monospace`, and replace raw values with design tokens (`--radius-md`, `--spacing-sm`, `--text-main`, `--text-muted`, `--border-color`).
- [x] 1.2 Refactor [ConfigField.jsx](file:///home/jmro/secretary-app/client/src/features/config/components/ui/ConfigField.jsx) to consume CSS Module classes (`styles.ConfigField__root`, `styles.ConfigField__label`, `styles.ConfigField__input`, `styles.ConfigField__hint`, `styles['ConfigField--monospace']`).
- [x] 1.3 Create [ConfigToggle.module.css](file:///home/jmro/secretary-app/client/src/features/config/components/ui/ConfigToggle.module.css) with scoped BEM rules (`.ConfigToggle__root`, `.ConfigToggle__label`, `.ConfigToggle__hint`, `.ConfigToggle__switch`) mapped to design tokens.
- [x] 1.4 Refactor [ConfigToggle.jsx](file:///home/jmro/secretary-app/client/src/features/config/components/ui/ConfigToggle.jsx) to import `ConfigToggle.module.css` and use BEM class names.

## Phase 2: Section CSS Refactor
- [x] 2.1 Complete guide classes in [IntegrationRemoteAccess.module.css](file:///home/jmro/secretary-app/client/src/features/config/components/sections/IntegrationRemoteAccess.module.css) (`.IntegrationRemoteAccess__guide`, `__guideTitle`, `__guideList`, `__link`, `__hintSmall`) using design tokens.
- [x] 2.2 Modernize [MessageTemplateEditor.module.css](file:///home/jmro/secretary-app/client/src/features/config/components/forms/MessageTemplateEditor.module.css) by eliminating hardcoded colors, pixel radii, and raw spacing in favor of `--radius-md`, `--radius-sm`, `--spacing-*`, `--card-surface-bg`, and `--glass-border`.
- [x] 2.3 Harmonize [BillingSettings.module.css](file:///home/jmro/secretary-app/client/src/features/config/components/sections/BillingSettings.module.css) by replacing residual hex fallbacks with semantic tokens (`--text-main`, `--text-secondary`, `--card-surface-bg`, `--border-color`).

## Phase 3: Automated Tests
- [x] 3.1 Create [ConfigField.test.jsx](file:///home/jmro/secretary-app/client/src/features/config/components/ui/ConfigField.test.jsx) testing label binding, input changes, helper hints, and monospace variant classes.
- [x] 3.2 Create [ConfigToggle.test.jsx](file:///home/jmro/secretary-app/client/src/features/config/components/ui/ConfigToggle.test.jsx) testing toggle toggling, label/description rendering, and disabled state.
- [x] 3.3 Verify existing config section tests including [BillingSettings.test.jsx](file:///home/jmro/secretary-app/client/src/features/config/components/sections/BillingSettings.test.jsx).

## Phase 4: Verification
- [x] 4.1 Run Stylelint or CSS audit check across all updated stylesheets to confirm zero hardcoded hex/radii values.
- [x] 4.2 Run Vitest test suite (`npm run test:run`) to ensure all unit tests pass.
- [x] 4.3 Run production client build (`npm run build`) to confirm zero bundle or syntax issues.
