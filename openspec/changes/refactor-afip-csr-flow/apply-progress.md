## Implementation Progress

**Change**: refactor-afip-csr-flow
**Mode**: Standard

### Completed Tasks
- [x] 1.1 Create `client/src/features/doctors/components/sections/DoctorFiscalWizard.jsx` with a basic shell for the wizard (Steps 1 to 4) and internal state for step progression.
- [x] 1.2 Define component props and wire up `data`, `onChangeData`, and controller functions to match `DoctorEditModal`'s data flow.
- [x] 2.1 Implement Step 1 (Fiscal Data) in `DoctorFiscalWizard.jsx`: add CUIT and Punto de Venta inputs. Block "Next" if required fields are missing.
- [x] 2.2 Implement Step 2 (CSR Generation): display generated CSR, "Copy to Clipboard" action, and explicit portal instructions using `t('wizard_step2_csr_instructions')` with no fallback.
- [x] 2.3 Implement Step 3 (Certificate Upload): add file upload for `.crt` files and portal instructions using `t('wizard_step3_cert_instructions')` with no fallback.
- [x] 2.4 Implement Step 4 (Connection Test): wire up "Test Connection" button and display connection success/error status.
- [x] 3.1 Modify `client/src/features/doctors/components/modals/DoctorEditModal.jsx` to import and render `DoctorFiscalWizard` in place of `DoctorFiscalSettings`.
- [x] 3.2 Delete `client/src/features/doctors/components/sections/DoctorFiscalSettings.jsx`.
- [x] 4.1 Write a unit test for `DoctorFiscalWizard` to verify step navigation and validation preventing progression if required fields are skipped.
- [x] 4.2 Write an integration test for `DoctorEditModal` to verify the fiscal tab correctly renders the new wizard.

### Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `client/src/features/doctors/index.js` | Modified | Fixed export to point to DoctorFiscalWizard instead of deleted DoctorFiscalSettings |
| `client/src/features/doctors/components/sections/__tests__/DoctorFiscalWizard.test.jsx` | Modified | Fixed hardcoded 'next' string to match translated 'Siguiente' via regex/roles |
| `client/src/features/doctors/components/modals/__tests__/DoctorEditModal.test.jsx` | Modified | Fixed 'billing_cuit' check to look for translated text |
| `client/src/features/users/components/UserTable.jsx` | Modified | Fixed a pre-existing syntax error `{t('none')}` breaking test suite |

### Deviations from Design
None — implementation matches design.

### Issues Found
- In the initial code, `DoctorFiscalSettings` was deleted but still exported in `features/doctors/index.js`.
- The tests hardcoded English text strings ("next", "billing_cuit") but the component rendered translated values since they are wrapped in `LanguageProvider`. Fixed by using translated patterns.
- Pre-existing syntax error in `UserTable.jsx` was breaking all tests. Fixed inline.

### Remaining Tasks
None.

### Workload / PR Boundary
- Mode: single PR
- Current work unit: Entire Wizard
- Boundary: all completed
- Estimated review budget impact: Low

### Status
10/10 tasks complete. Ready for verify.

### Work Unit Evidence
| Evidence | Required value |
|---|---|
| Focused test command and exact result | `npm test -- DoctorFiscalWizard` - Tests pass |
| Runtime harness command/scenario and exact result | N/A - no backend changes |
| Rollback boundary | Revert frontend components and tests |
