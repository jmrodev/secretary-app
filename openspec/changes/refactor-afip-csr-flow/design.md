## Technical Approach

Refactor the existing flat AFIP configuration form into a step-by-step wizard (`DoctorFiscalWizard`). This will guide users through setting up their AFIP credentials by breaking down the complex process into 4 logical steps: Fiscal Data, CSR Generation, Certificate Upload, and Connection Test. `DoctorEditModal` will be updated to render this wizard in the 'fiscal' tab instead of `DoctorFiscalSettings`. The wizard will manage the active step state internally but will sync form data up to the modal's main state to preserve the current save mechanics. All UI text will use the existing i18n approach (e.g., `t('some_key')`).

## Architecture Decisions

### Decision: State Management Strategy

**Choice**: Keep data state lifted in `DoctorEditModal` (via `onChangeData`) and controller state in `useDoctorFiscalController`, but manage wizard step progression internally within `DoctorFiscalWizard`.
**Alternatives considered**: Move all state management, including `useDoctorFiscalController`, into `DoctorFiscalWizard`.
**Rationale**: Keeping the data state lifted allows `DoctorEditModal` to handle the final save for all tabs uniformly. Keeping `useDoctorFiscalController` in the modal or passing its returns down maintains the current data flow and minimizes regression risk, while the step state is purely presentational and belongs in the wizard.

### Decision: Wizard Component Structure

**Choice**: Create a single `DoctorFiscalWizard` component that uses a switch statement or conditional rendering for the 4 steps, rather than 4 separate step components.
**Alternatives considered**: Create separate components for each step (`FiscalDataStep`, `CsrStep`, etc.).
**Rationale**: The steps are relatively small and share the same context and props. A single component reduces boilerplate and prop drilling. If it grows too large, it can be split later.

## Data Flow

    DoctorEditModal ── (data, onChangeData, controller functions) ─→ DoctorFiscalWizard
           │                                                                 │
           │                                                                 ├─→ Step 1: Inputs (updates data via onChangeData)
           │                                                                 ├─→ Step 2: Generates CSR (calls onGenerateCsr)
           │                                                                 ├─→ Step 3: Uploads Cert (calls onUploadCert)
           └────────────────── API / Backend ────────────────────────────────├─→ Step 4: Tests Conn (calls onTestConnection)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `client/src/features/doctors/components/sections/DoctorFiscalWizard.jsx` | Create | New wizard component encapsulating the 4 steps. |
| `client/src/features/doctors/components/sections/DoctorFiscalSettings.jsx` | Delete | Removed in favor of the new wizard. |
| `client/src/features/doctors/components/modals/DoctorEditModal.jsx` | Modify | Update imports and render `DoctorFiscalWizard` instead of `DoctorFiscalSettings` in the fiscal tab. |

## Interfaces / Contracts

```javascript
// DoctorFiscalWizard Props
interface DoctorFiscalWizardProps {
    data: {
        cuit: string;
        afip_pto_vta: string;
        // ... other doctor fields
    };
    onChangeData: (updates: Partial<DoctorData>) => void;
    
    // Controller actions and state
    generatedCsr: string | null;
    generatingCsr: boolean;
    uploading: boolean;
    connectionStatus: string | null;
    statusDetails: string | null;
    
    onGenerateCsr: () => Promise<void>;
    onUploadCert: (file: File) => Promise<void>;
    onTestConnection: () => Promise<void>;
    
    // i18n
    t: (key: string) => string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `DoctorFiscalWizard` | Render component, verify it starts on Step 1. Test "Next" and "Back" navigation. Verify validation prevents moving past Step 1 if CUIT/PTO VTA are missing. |
| Unit | `DoctorFiscalWizard` | Verify `onGenerateCsr`, `onUploadCert`, and `onTestConnection` are called correctly in their respective steps. |
| Integration | `DoctorEditModal` | Verify opening the fiscal tab renders the wizard and that data updates flow correctly to the modal's state. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. The backend remains untouched, and existing data will map directly to the inputs in Step 1 of the new wizard.

## Open Questions

- [ ] Are there specific i18n translation keys already defined for the new explicit instructions in Steps 2 and 3, or will they need to be added to the translation files?
