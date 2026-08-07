# Specification: Reports UI Redesign

## Requirements

### Requirement 1: Component Hierarchy & Atomic Design Structure
The `reports` feature MUST organize components cleanly following Atomic Design principles, isolating Page Orchestrators, Organisms, Molecules, and Atoms.

#### Scenario 1.1: Render Reports Dashboard with Atomic Components
- GIVEN a user navigating to `/reports`
- WHEN `ReportsPage` is mounted
- THEN `ReportsPage` delegates controller state to `ReportsDashboard`
- AND `ReportsDashboard` renders `FeatureToolbar` / `ReportTabs`, `ReportFilters`, and the active report table molecule.

---

### Requirement 2: Unified BEM Styling via CSS Modules
All components within `client/src/features/reports` MUST use CSS Modules with consistent BEM class naming conventions instead of mixing global un-scoped BEM utility strings with local module classes.

#### Scenario 2.1: Styling ReportFilters and Report Tables
- GIVEN any report component or table in `features/reports/components/`
- WHEN class names are assigned to DOM elements
- THEN elements use CSS module class names with BEM naming conventions (e.g. `styles.reportFilters__controls` or `styles['report-table__header']`)
- AND no hardcoded global layout overrides break theme variables.

---

### Requirement 3: Complete i18n Internationalization
All UI text elements, table headers, month names, day abbreviations, statuses, and fallback values MUST be fully localized using `useLanguage` / `t()`.

#### Scenario 3.1: Rendering table headers and days of the week in active locale
- GIVEN `AppointmentReportTable` or any report table
- WHEN dates or headers are displayed
- THEN day abbreviations (Lun, Mar, Mié...) and text fallbacks ("Sobreturno", "Finde", "Balance General") are resolved via `t()` translations without hardcoded string fallbacks.

---

### Requirement 4: Robust Data Controllers and Export Functions
The `useReportsController` hook MUST handle data fetching, period state changes (month, year), and data export functions (JSON download and Print) gracefully with error handling.

#### Scenario 4.1: Exporting report data
- GIVEN loaded report data for the selected period and tab
- WHEN the user clicks the "Download JSON" or "Print" action button
- THEN the system triggers a clean file download (`report_<tab>_<month>_<year>.json`) or formats the report view for native printing.
