## Intent

The current AFIP/Fiscal configuration section in the "Edit Doctor Details" modal presents all fields, actions, and information at once, overwhelming users when setting up or updating billing credentials. This change will refactor the AFIP/Fiscal module into a step-by-step guided "Wizard" to simplify the complex process of entering fiscal data, generating a CSR, uploading a certificate, and testing the connection.

## Scope

### In Scope
- Transforming the AFIP/Fiscal tab in `DoctorEditModal` into a multi-step Wizard component.
- Step 1: Input basic fiscal data (CUIT, Punto de Venta).
- Step 2: Generate CSR, copy to clipboard, and provide clear instructions on how to use it in the AFIP portal.
- Step 3: Upload the obtained Certificate (`.crt` file).
- Step 4: Final verification/Test Connection to confirm credentials are active.
- Improving error states, validation, and feedback messages per step.

### Out of Scope
- Changes to the underlying backend AFIP integration logic.
- Changes to other tabs or sections within the `DoctorEditModal`.
- Changes to the global `billing-config` (environment toggling).

## Capabilities

> This section is the CONTRACT between proposal and specs phases.
> The sdd-spec agent reads this to know exactly which spec files to create or update.

### New Capabilities
- `doctor-fiscal-wizard`: Defines the step-by-step UI flow for configuring a doctor's AFIP credentials, generating the CSR, and uploading certificates.

### Modified Capabilities
- `billing-config`: Update edit action reference to open the new fiscal wizard.

## Approach

We will create a new React component (e.g., `DoctorFiscalWizard`) to encapsulate the 4-step process. The `DoctorEditModal`'s fiscal tab will render this wizard instead of the current flat form. The wizard will manage its own internal step state while syncing the final form data (CUIT, Pto Vta, certificates) back to the modal's main form state. Each step will include explicit instructions (e.g., explaining what a CSR is in Step 2 and where to upload it in AFIP).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `components/DoctorEditModal/` | Modified | Replaces flat AFIP form with Wizard |
| `components/DoctorFiscalWizard/` | New | Contains the step-by-step UI logic |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Users get stuck on a step | Low | Provide explicit on-screen instructions and clear error messages at each step. |
| Existing valid credentials wiped accidentally | Low | Ensure the wizard detects existing credentials and allows skipping or shows "already configured" states. |

## Rollback Plan

Revert the PR containing the frontend UI refactor. The backend remains untouched, so data integrity is preserved and the old UI can safely resume managing the fields.

## Dependencies

- None

## Success Criteria

- [ ] Users can navigate linearly from CUIT entry to Connection Test.
- [ ] Explicit instructions are shown for generating the CSR and uploading the certificate.
- [ ] Users with existing credentials see them correctly reflected in the wizard.
- [ ] Successful certificate upload can be verified via the in-wizard connection test.
