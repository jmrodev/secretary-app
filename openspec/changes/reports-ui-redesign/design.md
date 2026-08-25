# Design Document: Reports UI Redesign ('reports-ui-redesign')

## Architecture & UI Component Plan

### 1. Component Hierarchy (Atomic Design)

```
client/src/features/reports/
├── ReportsPage.jsx                    [Page Orchestrator]
├── AuditLogsPage.jsx                 [Page Orchestrator]
├── hooks/
│   ├── useReportsController.js       [Main Controller Hook]
│   ├── useAuditLogsController.js    [Audit Logs Hook]
│   └── useReportExport.js            [Export/Print Utility Hook]
├── components/
│   ├── views/                         [Organisms / High-Level Views]
│   │   ├── ReportsDashboard.jsx
│   │   ├── BalanceView.jsx
│   │   └── AuditLogManager.jsx
│   ├── tables/                        [Molecules / Organisms]
│   │   ├── AppointmentReportTable.jsx
│   │   ├── PrescriptionReportTable.jsx
│   │   ├── LicenseReportTable.jsx
│   │   ├── CertificateReportTable.jsx
│   │   └── AuditLogTable.jsx
│   └── ui/                            [Molecules & UI Controls]
│       ├── ReportFilters.jsx
│       ├── ReportTabs.jsx
│       └── ReportSummaryCard.jsx
```

### 2. State & Data Flow Architecture

- **State Management**:
  - `activeTab`: `'appointments' | 'prescriptions' | 'licenses' | 'certificates' | 'balance'`
  - `period`: `{ month: number, year: number }`
  - `selectedDoctorId`: doctor filter state (inherited from `DoctorContextDefinition` or local control).
  - `reportData`: normalized data payload per tab or unified data structure for `balance`.
  - `loading` / `isSubmitting`: granular loading state for queries.

- **Data Sources**:
  - GET `/appointments/report/monthly` via `useAppointments()`
  - GET `/medical/prescriptions/export/json`
  - GET `/medical/licenses/export/json`
  - GET `/medical/certificates/export/json`
  - GET `/logs`

### 3. Styling Guidelines (BEM in CSS Modules)

- Replace hybrid styling with strict BEM structure using CSS Modules:
  ```css
  /* ReportFilters.module.css */
  .reportFilters { ... }
  .reportFilters__controls { ... }
  .reportFilters__field { ... }
  .reportFilters__actions { ... }
  .reportFilters__button--active { ... }
  ```
- Ensure dark/light mode compatibility using CSS custom properties (`var(--color-bg-primary)`, `var(--color-text-primary)`).

### 4. Internationalization (i18n)

- Complete translation coverage for all report tabs, action buttons, table columns, date formats, and fallback values.
- Replace fallback strings like `t('sunday_short') || 'Dom'` with localized keys defined in translations system.
- Standardize currency formatting using `Intl.NumberFormat(locale, { style: 'currency', currency: 'ARS' })` or core formatting helpers.
