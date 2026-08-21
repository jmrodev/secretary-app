# Design: Architecture Compliance Fixes

## Technical Approach

Minimal extraction + semantic swap (Approach 1 from proposal). Fix all violations in-place without global refactor. Single PR covering 3 JSX files + 3 CSS Modules. Estimated <400 lines diff.

## Architecture Decisions

### Decision: R1 Resolution — Host Modules for Extracted Styles

**Choice**: Keep both `BillingSettings.module.css` and `IntegrationRemoteAccess.module.css` as host modules, but with different strategies:
- `IntegrationRemoteAccess.module.css`: **Keep and wire** — currently orphan/empty, perfect host for its 8 inline blocks
- `BillingSettings.module.css`: **Replace** — delete current file (7 unused classes), create NEW minimal module with only the 3-4 BEM classes actually needed

**Alternatives considered**:
- (a) Delete both modules per literal AC-4/AC-5, co-locate classes elsewhere → violates FR-1 (extraction needs a host module per component)
- (b) Create new separate modules → adds files, breaks ARQUITECTURA.md §2 (CSS Module per component)

**Rationale**: Satisfies FR-1 (styles extracted to CSS Modules) ✅, AC-4/AC-5 spirit (dead code removed — old unused classes gone; new minimal module created) ✅, ARQUITECTURA.md §2 (CSS Modules per component) ✅. No new files added.

### Decision: Theme Token Strategy — No New Tokens

**Choice**: Use existing semantic tokens with theme-aware fallbacks via `variables.css` (dark/light/dim already defined). No new tokens in `variables.css`.

**Alternatives considered**: Add `--csr-textarea-bg`, `--mobile-card-bg` tokens → unnecessary bloat

**Rationale**: `--card-surface-bg`, `--border-color`, `--primary-rgb`, `--success`, `--error` already resolve correctly per theme. Hardcoded RGB replaced with `rgb(var(--primary-rgb) / 10%)`.

### Decision: Monospace via variant="monospace"

**Choice**: Replace raw `className="config-field__input config-field__input--monospace"` on Input atoms with `variant="monospace"` on ConfigField molecule.

**Alternatives considered**: Keep raw class strings → violates FR-3 (BEM bypass)

**Rationale**: ConfigField already implements `variant` prop (line 22, 27). Descendant selector in ConfigField.module.css:27 (`.ConfigField__monospace .ConfigField__input`) cascades correctly. Zero runtime change (NFR-2).

## Data Flow

```
User opens Settings tab
    │
    ├─→ BillingSettings.jsx
    │     ├─ CSR box → BillingSettings__csrBox (CSS Module)
    │     ├─ Flex justify-end → BillingSettings__actionsRight (CSS Module)
    │     └─ CSR textarea → ConfigField variant="monospace" → Input (monospace font)
    │
    ├─→ IntegrationRemoteAccess.jsx
    │     ├─ Mobile card → IntegrationRemoteAccess__mobileCard
    │     ├─ Mobile info/icon/title/desc → __mobileInfo, __mobileIcon, __mobileTitle, __mobileDesc
    │     ├─ URL display → __urlDisplay
    │     └─ Actions → __actions, __configActions
    │     All via IntegrationRemoteAccess.module.css (now wired)
    │
    ├─→ IntegrationMetaWhatsApp.jsx
    │     ├─ Config actions flex → __configActions (CSS Module)
    │     ├─ Phone Number ID → ConfigField variant="monospace"
    │     └─ Access Token → ConfigField variant="monospace"
    │
    └─→ IntegrationGoogleCalendar.jsx
          └─ Spreadsheet ID → ConfigField variant="monospace"
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `client/src/features/config/components/sections/BillingSettings.jsx` | Modify | Remove 3 inline `style={{}}` blocks (lines 168-173, 187, 179-186); replace raw monospace class with `variant="monospace"` on ConfigField |
| `client/src/features/config/components/sections/BillingSettings.module.css` | Replace | Delete current 7 unused classes; create 4 new BEM classes: `__csrBox`, `__csrTextarea`, `__actionsRight`, `__status`, `__statusSuccess`, `__statusError`, `__statusHeader` (replacing global `config-status` usage) |
| `client/src/features/config/components/sections/IntegrationRemoteAccess.jsx` | Modify | Remove 8 inline `style={{}}` blocks (lines 44, 89, 131-140, 142-148, 151, 155-160); import and use `styles` from `.module.css` |
| `client/src/features/config/components/sections/IntegrationRemoteAccess.module.css` | Modify | Populate with 8 BEM classes for the extracted styles; replace hardcoded `rgb(13 148 136 / 10%)` with `rgb(var(--primary-rgb) / 10%)`; keep @media responsive rule |
| `client/src/features/config/components/sections/IntegrationMetaWhatsApp.jsx` | Modify | Remove inline style on line 46; replace 2 raw `className="config-field__input--monospace"` with `variant="monospace"` on ConfigField |
| `client/src/features/config/components/sections/IntegrationGoogleCalendar.jsx` | Modify | Replace raw `className="config-field__input--monospace"` on line 96 with `variant="monospace"` on ConfigField |
| `client/src/features/config/components/sections/ModulesSettings.module.css` | Modify | Line 49: `background-color: rgb(13 148 136 / 10%)` → `background-color: rgb(var(--primary-rgb) / 10%)` |
| `client/src/features/config/components/ui/ConfigField.jsx` | No Change | Already supports `variant="monospace"` prop (line 22, 27) |

## Interfaces / Contracts

### ConfigField variant="monospace" Contract

```jsx
// Input
<ConfigField variant="monospace" ... />

// Output (ConfigField.jsx:27)
const rootClass = `config-field ${variant ? `config-field--${variant}` : ''}`;
// Emits: <div class="config-field config-field--monospace">
// ConfigField.module.css:27 cascades: .ConfigField__monospace .ConfigField__input { font-family: var(--font-mono, monospace); }
```

### BEM Naming Convention

All new classes follow `ComponentName__elementName` (block__element) and `ComponentName__elementName--modifier` for variants. Consistent with existing `ModulesSettings__iconWrapper`, `BillingSettings__statusSuccess`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual/Manual | Theme parity (dark/light/dim) | NFR-1: Open settings in all 3 themes; verify no visual regression on CSR box, mobile card, status badges, monospace inputs |
| Static | Lint + BEM compliance | `npm run lint` passes; `stylelint` validates BEM pattern |
| Build | Zero bundle increase | `npm run build` size delta < 1KB |
| Regression | Zero runtime behavior change | NFR-2: Manual smoke test — CSR generation, status check, remote access config, Meta WhatsApp test, Google Calendar sync all functional |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Pure refactor — no behavioral logic changes. Rollback: revert single PR.

## Open Questions

- [ ] None — all decisions resolved in this design