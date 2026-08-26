# Spec: Billing Configuration & Doctor Fiscal Overview

## Purpose

Defines the billing configuration architecture, shifting system-wide billing settings from single-doctor AFIP credentials to global fiscal environment management and a centralized doctor fiscal status matrix.

## Requirements

### Requirement 1: Global Fiscal Environment Settings
- The `BillingSettings` view MUST manage only clinic-wide fiscal parameters (e.g., `afip_environment` toggling between `'testing'` and `'production'`).
- The `BillingSettings` view MUST NOT store or edit single-doctor credentials (`cuit`, `afip_pto_vta`, private keys, or certificates) as global settings.

#### Scenario: Admin or Secretary toggles fiscal environment (Happy Path)
- GIVEN an authenticated `admin` or `secretary` viewing `/config?tab=billing`
- WHEN the user changes `afip_environment` from `testing` to `production`
- THEN the system setting `afip_environment` MUST be updated to `production`
- AND a confirmation notification MUST be displayed.

---

### Requirement 2: Doctor Fiscal Status Matrix
- `BillingSettings` MUST display a doctor fiscal overview table listing all active doctors in the clinic.
- For each doctor, the table MUST display:
  - Doctor full name and specialty
  - CUIT (configured or missing badge)
  - Point of Sale (`afip_pto_vta` configured or missing badge)
  - Digital Certificate / Key status (`afipCrt` & `afipKey` present or missing badge)
  - Overall AFIP readiness status (`Ready` when CUIT, POS, and certificate/key exist; `Incomplete` otherwise)
- Each row MUST provide an action button to open the doctor's fiscal configuration in `DoctorEditModal`.

#### Scenario: Doctor with complete fiscal credentials displayed as ready
- GIVEN a doctor with valid `cuit`, `afip_pto_vta`, and uploaded `afipCrt`/`afipKey`
- WHEN `BillingSettings` renders the doctor matrix
- THEN the doctor row MUST display green success badges for CUIT, POS, Certificate, and an overall `Ready` status.

#### Scenario: Doctor with missing certificate displayed as incomplete
- GIVEN a doctor with `cuit` and `afip_pto_vta` configured but no uploaded `afipCrt`
- WHEN `BillingSettings` renders the doctor matrix
- THEN the doctor row MUST display a warning badge for Certificate and an overall `Incomplete` status.

#### Scenario: User clicks doctor edit action from billing matrix
- GIVEN an authenticated user viewing the doctor fiscal matrix in `BillingSettings`
- WHEN the user clicks the edit action on a doctor's row
- THEN `DoctorEditModal` MUST open pre-populated with that doctor's data focused on or displaying fiscal fields.

---

### Requirement 3: AFIP Server Health Verification
- `BillingSettings` MUST provide a connection verification action that checks AFIP server status for the current `afip_environment`.
- When AFIP services are unreachable, the UI MUST display an error status and preserve existing settings without crashing.

#### Scenario: Successful AFIP connection check
- GIVEN AFIP test/production web services are reachable
- WHEN the user clicks "Verify AFIP Connection"
- THEN the UI MUST display server status (`AppServer`, `DbServer`, `AuthServer`) with a success indicator.

#### Scenario: AFIP connection check fails
- GIVEN AFIP web services are offline or returning an error
- WHEN the user clicks "Verify AFIP Connection"
- THEN the UI MUST display the error message returned by the server with an error badge.

---

### Requirement 4: DoctorEditModal Schedule Prop Guard from Billing

When `BillingSettings` launches `DoctorEditModal` for fiscal editing, the modal MUST NOT throw when the user switches to the `schedule` tab.
- `BillingSettings` MUST pass schedule-related props (`schedule`, `setSchedule`, `loadingSchedule`) into `DoctorEditModal`, OR MUST prevent the `schedule` tab from being selectable in that launch context.
- `DoctorEditModal` MUST forward `setSchedule` verbatim to `DoctorScheduleSettings` so the latter always receives a callable (or receives no schedule tab at all).
- This MUST hold for the launch path at `client/src/features/config/components/sections/BillingSettings.jsx:272-285`.

#### Scenario: Switching to schedule tab from billing-launched modal does not crash
- GIVEN `BillingSettings` opened `DoctorEditModal` in `fiscal` tab (without initial schedule data)
- WHEN the user switches to the `schedule` tab inside that modal
- THEN `DoctorScheduleSettings` receives a valid `setSchedule` (no-op or real) and no `TypeError: setSchedule is not a function` is thrown.

#### Scenario: Billing launch passes schedule props
- GIVEN `BillingSettings` renders the fiscal edit modal
- WHEN the modal mounts its `schedule` section
- THEN `DoctorEditModal` receives `schedule`, `setSchedule`, and `loadingSchedule` props from `BillingSettings`.
