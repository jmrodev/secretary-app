# Proposal: Config Tabs Style Unification

## Intent
Unify and harmonize CSS Modules, BEM class naming conventions, and design token adherence across all configuration tab components (`ModulesSettings`, `CommunicationSettings`, `MessageTemplateEditor`, `IntegrationSettings` [Google, Meta, RemoteAccess], `BillingSettings`, `ConfigField`, and `ConfigToggle`).

## Scope
### In Scope
- Link and modernize [`ConfigField.jsx`](file:///home/jmro/secretary-app/src/components/common/ConfigField.jsx) with [`ConfigField.module.css`](file:///home/jmro/secretary-app/src/components/common/ConfigField.module.css).
- Create [`ConfigToggle.module.css`](file:///home/jmro/secretary-app/src/components/common/ConfigToggle.module.css) and refactor [`ConfigToggle.jsx`](file:///home/jmro/secretary-app/src/components/common/ConfigToggle.jsx) to strict BEM CSS Modules.
- Complete missing `.IntegrationRemoteAccess__guide*` styling with design tokens in [`IntegrationRemoteAccess.module.css`](file:///home/jmro/secretary-app/src/components/Config/IntegrationRemoteAccess.module.css).
- Replace hardcoded radii, raw spacing, and hex colors in [`MessageTemplateEditor.module.css`](file:///home/jmro/secretary-app/src/components/Config/MessageTemplateEditor.module.css) with semantic tokens (`--radius-*`, `--spacing-*`, `--card-surface-bg`, etc.).
- Harmonize [`BillingSettings.module.css`](file:///home/jmro/secretary-app/src/components/Config/BillingSettings.module.css) tokens and eliminate residual hardcoded colors.
- Audit all config tabs for full light, dim, and dark theme compatibility.
- Ensure component unit tests pass.

### Out of Scope
- Backend API schema changes or business logic mutations.
- Re-architecting state management or form storage.

## Capabilities
### New Capabilities
- Encapsulated, tokenized CSS module for [`ConfigToggle`](file:///home/jmro/secretary-app/src/components/common/ConfigToggle.jsx).
- Complete remote access guide styling tokenized for responsive viewports and multi-theme rendering.

### Modified Capabilities
- Standardized CSS module imports and BEM class names across configuration views.
- Strict token consumption (`--color-*`, `--radius-*`, `--spacing-*`, `--shadow-*`) replacing hardcoded CSS values.

## Approach
1. **Common Components**: Modernize [`ConfigField`](file:///home/jmro/secretary-app/src/components/common/ConfigField.jsx) and [`ConfigToggle`](file:///home/jmro/secretary-app/src/components/common/ConfigToggle.jsx) to adopt consistent BEM styling and CSS modules.
2. **Tab Styling & Tokenization**: Refactor styling across [`MessageTemplateEditor.module.css`](file:///home/jmro/secretary-app/src/components/Config/MessageTemplateEditor.module.css), [`IntegrationRemoteAccess.module.css`](file:///home/jmro/secretary-app/src/components/Config/IntegrationRemoteAccess.module.css), and [`BillingSettings.module.css`](file:///home/jmro/secretary-app/src/components/Config/BillingSettings.module.css).
3. **Multi-theme Verification**: Verify contrast and aesthetic consistency across dark, dim, and light themes.
4. **Validation**: Execute component unit and UI tests.

## Affected Areas
- `src/components/common/ConfigField.jsx`, `ConfigField.module.css`
- `src/components/common/ConfigToggle.jsx`, `ConfigToggle.module.css`
- `src/components/Config/IntegrationRemoteAccess.module.css`
- `src/components/Config/MessageTemplateEditor.module.css`
- `src/components/Config/BillingSettings.module.css`

## Risks & Rollback Plan
- **Risks**: Layout shifts or visual regressions in nested forms across different themes.
- **Rollback Plan**: Revert CSS module and component changes via git commit rollback.

## Dependencies
- CSS Design Token System (`src/styles/tokens.css` or equivalent root theme variables).

## Success Criteria
- [ ] 0 hardcoded colors/radii in targeted CSS modules.
- [ ] `ConfigToggle` and `ConfigField` utilize CSS Modules with BEM structure.
- [ ] All configuration tabs render properly across light, dim, and dark themes.
- [ ] All unit and visual regression tests pass cleanly.
