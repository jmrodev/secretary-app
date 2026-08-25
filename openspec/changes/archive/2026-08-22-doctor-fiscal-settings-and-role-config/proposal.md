# Proposal: Doctor Fiscal Settings and Role Config

## Intent

Align system configuration and billing architecture with domain reality: doctor-specific AFIP credentials (CUIT, certificates, points of sale) belong to individual doctor entities and are managed in `DoctorEditModal`, while `/config` -> `BillingSettings` focuses on global fiscal environment settings (e.g. testing mode) and an overview matrix of doctor fiscal statuses. Furthermore, ensure role-based configuration registry access allows `admin` and `secretary` appropriately across all tabs.

## Scope

### In Scope
- Refactor `/config/billing` ([`BillingSettings.jsx`](file:///home/jmro/secretary-app/client/src/features/config/components/sections/BillingSettings.jsx)) into a global environment toggle + doctor fiscal status matrix.
- Ensure [`ConfigRegistryLoader.jsx`](file:///home/jmro/secretary-app/client/src/features/config/registry/ConfigRegistryLoader.jsx) allows `admin` and `secretary` roles appropriately across all config tabs.
- Document doctor-specific billing and single-bridge WhatsApp multi-doctor workflow.
- Update and add unit/integration tests for billing configuration and doctor fiscal settings.

### Out of Scope
- Multi-device WhatsApp bridge architecture (remains a single consultorio bridge).
- Modifications to core AFIP invoicing engine in `billingService.js`.

## Capabilities

### New Capabilities
- Doctor Fiscal Overview Matrix: Centralized summary in Billing Settings showing configured CUIT, certificate validity/status, and POS per doctor with direct edit actions.
- Role-scoped Configuration Access: Unified role-based access control across configuration registry sections for `admin` and `secretary`.

### Modified Capabilities
- Global Billing Configuration: Shift from configuring individual doctor AFIP credentials in system billing settings to managing system-wide fiscal environment defaults and monitoring doctor readiness.

## Approach

1. **Billing Settings Component Refactor**: Transform `BillingSettings.jsx` to display global billing switches (e.g., AFIP testing/production mode) and a read-only/link matrix listing all doctors with their AFIP setup status (CUIT present, cert uploaded, POS configured).
2. **Config Registry & Role Permissions**: Verify and update `ConfigRegistryLoader.jsx` tab definitions to ensure `admin` and `secretary` permissions match system domain boundaries.
3. **Documentation & Tests**: Update user/system documentation regarding single-bridge WhatsApp consultorio setup and doctor-specific billing; write unit/integration tests for `BillingSettings` and `DoctorEditModal` fiscal flows.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `client/src/features/config/components/sections/BillingSettings.jsx` | Modified | Replace single-doctor credentials form with global toggle & doctor status matrix |
| `client/src/features/config/registry/ConfigRegistryLoader.jsx` | Modified | Verify and refine role permissions for config tabs (`admin`, `secretary`) |
| `client/src/features/doctors/` | Modified | Verify doctor fiscal editing integration from modal |
| `docs/` | Modified | Document billing architecture and single-bridge WhatsApp workflow |
| `client/src/features/config/__tests__/` | Modified/Added | Unit and integration tests for billing config and role access |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Confusion around where doctor AFIP keys are configured | Low | Provide clear explanatory copy and direct links to doctor edit modal from billing settings |
| Accidental permission escalation/lockout in config registry | Low | Explicit role-checking unit tests for all registered tabs |

## Rollback Plan

Revert the change branch. Data structures for doctor fiscal attributes already exist on doctor models and remain backward-compatible.

## Dependencies

- Existing `DoctorEditModal` and doctor store fiscal fields (`cuit`, `afipCrt`, `afipKey`, `afipPtoVta`).
- Existing configuration registry infrastructure.

## Success Criteria

- [ ] `/config/billing` renders global environment configuration and the doctor fiscal status matrix.
- [ ] Direct edit links/actions from the status matrix open the doctor edit flow with fiscal fields.
- [ ] `ConfigRegistryLoader` enforces valid role accessibility for both `admin` and `secretary`.
- [ ] All automated unit and integration tests for billing config and role access pass.
