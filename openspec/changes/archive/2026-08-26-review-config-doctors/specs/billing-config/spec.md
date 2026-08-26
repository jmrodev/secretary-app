# Delta for Billing Configuration

## ADDED Requirements

### Requirement: DoctorEditModal Schedule Prop Guard from Billing

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
