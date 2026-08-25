# Technical Design: Config Tabs Style Unification

## Technical Approach
Standardize CSS Modules, BEM class naming conventions, and design token adherence across all configuration tab components. Replace hardcoded dimensions, hex colors, and custom layout classes with semantic custom properties from `src/styles/variables.css` (`--radius-*`, `--spacing-*`, `--card-surface-bg`, `--glass-border`, `--text-main`, `--text-muted`, `--border-color`, `--primary-color`). Refactor `ConfigField` and `ConfigToggle` into fully scoped BEM CSS modules.

```mermaid
flowchart TD
    subgraph Design_Tokens [Design Tokens (variables.css)]
        Tokens["--radius-*, --spacing-*, --card-surface-bg, --border-color, --text-main"]
    end

    subgraph Common_Molecules [Common Feature UI]
        CF["ConfigField (ConfigField.module.css)"]
        CT["ConfigToggle (ConfigToggle.module.css)"]
    end

    subgraph Config_Sections [Configuration Sections]
        IRA["IntegrationRemoteAccess.module.css"]
        MTE["MessageTemplateEditor.module.css"]
        BS["BillingSettings.module.css"]
    end

    Tokens --> CF
    Tokens --> CT
    Tokens --> IRA
    Tokens --> MTE
    Tokens --> BS
    CF --> IRA
    CF --> BS
    CT --> BS
```

---

## Architecture Decisions

### Decision 1: Scoped CSS Modules with Strict BEM
- **Context**: `ConfigField` used mixed legacy classnames (`config-field`, `config-field__input`), and `ConfigToggle` lacked its own module stylesheet (`config-field--inline`).
- **Choice**: Encapsulate styles with `styles.ConfigField__root`, `styles.ConfigField__label`, `styles.ConfigField__input`, `styles.ConfigField__hint`, `styles['ConfigField--monospace']`. Create `ConfigToggle.module.css` implementing `.ConfigToggle__root`, `.ConfigToggle__label`, `.ConfigToggle__hint`, `.ConfigToggle__switch`.
- **Alternatives Considered**: Global utility classes. Rejected to avoid CSS collisions and maintain encapsulation.

### Decision 2: Design Token Harmonization
- **Context**: Hardcoded pixel values (`12px`, `6px`), raw rgba values, and fallback hex colors (`#1a202c`, `#a0aec0`, `#e2e8f0`) were scattered across `MessageTemplateEditor.module.css`, `BillingSettings.module.css`, and `IntegrationRemoteAccess.module.css`.
- **Choice**: Map all hardcoded values to standard variables:
  - Radius: `--radius-lg` (8px/12px container cards), `--radius-md` (6px buttons/inputs), `--radius-sm` (4px badges/subtle controls).
  - Spacing: `--spacing-xs` (4px), `--spacing-sm` (8px), `--spacing-md` (16px), `--spacing-lg` (24px).
  - Surfaces & Borders: `--card-surface-bg`, `--dashboard-card-bg`, `--dashboard-card-border`, `--border-color`, `--glass-border`.
  - Colors: `--text-main`, `--text-muted`, `--text-secondary`, `--primary-color`, `--accent-color`.

### Decision 3: Completing Guide Classes in `IntegrationRemoteAccess.module.css`
- **Context**: `IntegrationRemoteAccess.jsx` renders `.IntegrationRemoteAccess__guide`, `__guideTitle`, `__guideList`, `__link`, and `__hintSmall`, which lacked styling in its module.
- **Choice**: Define `.IntegrationRemoteAccess__guide*` rules utilizing `--card-surface-bg`, `--radius-md`, `--border-color`, and `--text-muted` to ensure seamless multi-theme rendering (dark, dim, light).

---

## Data Flow & Component Interaction
1. **Host Settings View** renders `ConfigField` / `ConfigToggle` with props (`label`, `hint`/`description`, `value`, `onChange`).
2. **Molecule Render**:
   - `ConfigField` combines `styles.ConfigField__root` with variant modifier `styles['ConfigField--monospace']`, rendering label, input/select with `styles.ConfigField__input`, and hint with `styles.ConfigField__hint`.
   - `ConfigToggle` renders container `styles.ConfigToggle__root`, text group (`styles.ConfigToggle__label`, `styles.ConfigToggle__hint`), and the atomic `Switch`.
3. **Sections**: `IntegrationRemoteAccess`, `MessageTemplateEditor`, and `BillingSettings` consume tokens ensuring dynamic theme responsiveness upon `:root[data-theme]` updates.

---

## File Changes

| File Path | Action | Description |
|---|---|---|
| `client/src/features/config/components/ui/ConfigField.jsx` | Modify | Use CSS Module BEM classes for root, input, label, hint, and monospace modifier. |
| `client/src/features/config/components/ui/ConfigField.module.css` | Modify | Add `.ConfigField__input`, modifier `.ConfigField--monospace`, convert units to design tokens. |
| `client/src/features/config/components/ui/ConfigToggle.module.css` | Create | Define `.ConfigToggle__root`, `.ConfigToggle__label`, `.ConfigToggle__hint`, `.ConfigToggle__switch` using design tokens. |
| `client/src/features/config/components/ui/ConfigToggle.jsx` | Modify | Import `ConfigToggle.module.css` and replace legacy classes with CSS Module BEM identifiers. |
| `client/src/features/config/components/sections/IntegrationRemoteAccess.module.css` | Modify | Add missing classes: `.IntegrationRemoteAccess__guide`, `.IntegrationRemoteAccess__guideTitle`, `.IntegrationRemoteAccess__guideList`, `.IntegrationRemoteAccess__link`, `.IntegrationRemoteAccess__hint`, `.IntegrationRemoteAccess__hintSmall`. |
| `client/src/features/config/components/forms/MessageTemplateEditor.module.css` | Modify | Replace raw pixels (`12px`, `6px`, `1rem`, `1.5rem`) and raw colors with `--radius-md`, `--radius-sm`, `--spacing-*`, `--card-surface-bg`, `--glass-border`. |
| `client/src/features/config/components/sections/BillingSettings.module.css` | Modify | Remove hardcoded hex fallbacks (`#1a202c`, `#a0aec0`, `#e2e8f0`) and align with `--text-main`, `--text-secondary`, `--card-surface-bg`, `--border-color`. |
| `client/src/features/config/components/ui/ConfigField.test.jsx` | Create | Add unit tests for `ConfigField` rendering, variants, hints, and inputs. |
| `client/src/features/config/components/ui/ConfigToggle.test.jsx` | Create | Add unit tests for `ConfigToggle` rendering, toggling, and description. |

---

## Interfaces / Contracts

### `ConfigField` Props
```typescript
interface ConfigFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  hint?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<any>) => void;
  disabled?: boolean;
  placeholder?: string;
  id: string;
  variant?: 'monospace' | string;
  className?: string;
  options?: Array<{ value: string; label: string }>;
  readOnly?: boolean;
  rows?: number;
}
```

### `ConfigToggle` Props
```typescript
interface ConfigToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | boolean) => void;
  disabled?: boolean;
  className?: string;
}
```

---

## Testing Strategy
1. **Unit Tests (Vitest + React Testing Library)**:
   - `client/src/features/config/components/ui/ConfigField.test.jsx`: Verify label, input binding, hint rendering, and CSS module class attachment (`ConfigField__root`, `ConfigField--monospace`).
   - `client/src/features/config/components/ui/ConfigToggle.test.jsx`: Test switch state changes, label/description rendering, disabled state.
   - `client/src/features/config/components/sections/BillingSettings.test.jsx`: Ensure existing tests pass cleanly without regression.
2. **CSS / Linter Verification**:
   - Stylelint/grep validation verifying 0 hardcoded colors/radii in targeted modules.
   - Visual inspection across `[data-theme="light"]`, `[data-theme="dim"]`, and default dark theme.

---

## Threat Matrix

| Risk / Threat | Impact | Likelihood | Mitigation |
|---|---|---|---|
| CSS specificity conflicts with Atom components | Medium | Low | Use standard scoped CSS module class concatenation; avoid `!important`. |
| Theme contrast regression in light/dim modes | Medium | Low | Rely on existing semantic variables (`--card-surface-bg`, `--text-main`, `--border-color`) which adapt automatically per theme. |
| Layout breakage in responsive/mobile breakpoints | Low | Low | Preserve flex/grid rules and verify responsive media queries at `<= 600px`. |

---

## Migration / Rollout
- Changes are purely presentational CSS module and UI molecule component updates.
- No database migrations, API changes, or feature flags required.
- Rollback via git commit revert if UI regressions are detected.
