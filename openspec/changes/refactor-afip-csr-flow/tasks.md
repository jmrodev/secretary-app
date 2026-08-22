## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250-300 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Entire Wizard | PR 1 | `npm test -- DoctorFiscalWizard` | N/A | Revert PR |

## Phase 1: Foundation Component

- [x] 1.1 Create `client/src/features/doctors/components/sections/DoctorFiscalWizard.jsx` with a basic shell for the wizard (Steps 1 to 4) and internal state for step progression.
- [x] 1.2 Define component props and wire up `data`, `onChangeData`, and controller functions to match `DoctorEditModal`'s data flow.

## Phase 2: Core Implementation (Steps)

- [x] 2.1 Implement Step 1 (Fiscal Data) in `DoctorFiscalWizard.jsx`: add CUIT and Punto de Venta inputs. Block "Next" if required fields are missing.
- [x] 2.2 Implement Step 2 (CSR Generation): display generated CSR, "Copy to Clipboard" action, and explicit portal instructions using `t('wizard_step2_csr_instructions')` with no fallback.
- [x] 2.3 Implement Step 3 (Certificate Upload): add file upload for `.crt` files and portal instructions using `t('wizard_step3_cert_instructions')` with no fallback.
- [x] 2.4 Implement Step 4 (Connection Test): wire up "Test Connection" button and display connection success/error status.

## Phase 3: Integration

- [x] 3.1 Modify `client/src/features/doctors/components/modals/DoctorEditModal.jsx` to import and render `DoctorFiscalWizard` in place of `DoctorFiscalSettings`.
- [x] 3.2 Delete `client/src/features/doctors/components/sections/DoctorFiscalSettings.jsx`.

## Phase 4: Testing

- [x] 4.1 Write a unit test for `DoctorFiscalWizard` to verify step navigation and validation preventing progression if required fields are skipped.
- [x] 4.2 Write an integration test for `DoctorEditModal` to verify the fiscal tab correctly renders the new wizard.
