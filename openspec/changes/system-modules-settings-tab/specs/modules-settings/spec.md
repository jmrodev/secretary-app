# Spec: System Modules Configuration Tab

## Requirements

### Requirement 1: Dedicated Modules Configuration Section
- The system SHALL provide a dedicated configuration section registered under the id `modules`.
- The section SHALL display a minimalist grid of configurable business modules.
- The section SHALL use design tokens from `variables.css` and follow BEM styling via CSS Modules.

### Requirement 2: Office Rentals Module Toggle
- The section SHALL display an item for "Office Rentals" (`enable_office_rentals`).
- When toggled by an administrator, it SHALL invoke `updateSetting('enable_office_rentals', newValue)`.
- When disabled (`false`), non-admin users SHALL not have access to office rental features or navbar link.

### Requirement 3: Clean Separation from General Settings
- `GeneralSettings.jsx` SHALL NOT render business feature flags or the `enable_office_rentals` switch.
- `GeneralSettings.jsx` SHALL strictly contain network addresses (public and local URLs, QR) and mobile app distribution.
