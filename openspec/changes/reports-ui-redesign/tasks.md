# Tasks: Reports UI Redesign ('reports-ui-redesign')

- [ ] 1. Component Architecture & Atomic Design Refactoring
  - [ ] 1.1 Review and align `ReportsPage.jsx` and `AuditLogsPage.jsx` as pure orchestrators.
  - [ ] 1.2 Refactor `ReportsDashboard.jsx`, `BalanceView.jsx`, and `AuditLogManager.jsx` into well-defined Organisms.
  - [ ] 1.3 Ensure `ReportFilters.jsx` and `ReportTabs.jsx` reuse atomic inputs and buttons cleanly.

- [ ] 2. BEM Styling & CSS Modules Standardization
  - [ ] 2.1 Migrate `AppointmentReportTable.module.css` and `AppointmentReportTable.jsx` to strict CSS Module BEM classes.
  - [ ] 2.2 Migrate `ReportFilters.module.css` and `ReportFilters.jsx` BEM class references.
  - [ ] 2.3 Refactor `AuditLogManager.module.css` and `AuditLogTable.module.css` for consistent BEM naming.

- [ ] 3. i18n Internationalization & Localized Formatting
  - [ ] 3.1 Extract all hardcoded strings and fallbacks in `AppointmentReportTable.jsx` ("Sobreturno", "Finde", "Dom", "Lun", etc.) to translation keys.
  - [ ] 3.2 Add missing translation keys for reports in Spanish and English translation files.
  - [ ] 3.3 Ensure currency values use standard ARS formatting across all tables and `BalanceView.jsx`.

- [ ] 4. Controller Refactoring & Verification
  - [ ] 4.1 Update `useReportsController.js` to handle loading/error states cleanly for all tabs.
  - [ ] 4.2 Validate JSON export and print functionality across browsers.
  - [ ] 4.3 Run linting and build checks to verify zero regressions.
