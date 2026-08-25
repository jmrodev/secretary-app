# Implementation Tasks: Doctor Fiscal Settings & Configuration Role Access

<!-- Review Workload Forecast: 4 files, ~250 LOC diff, size: small -->

## Review Workload Forecast

| File | Changes | Complexity |
|---|---|---|
| `client/src/features/config/components/ConfigRegistryLoader.jsx` | Update allowed roles for config sections | Low |
| `client/src/features/config/components/sections/BillingSettings.jsx` | Global environment toggle + doctor fiscal status matrix + DoctorEditModal link | Medium |
| `client/src/features/config/components/sections/BillingSettings.module.css` | Styles for doctor overview table and badges | Low |
| `client/src/features/config/components/ConfigRegistryLoader.test.jsx` | Assertions for `allowedRoles` across all registered tabs | Low |
| `client/src/features/config/components/sections/BillingSettings.test.jsx` | Unit tests for BillingSettings rendering, environment toggle, and doctor matrix | Medium |

---

## Phase 1: Config Registry & Permissions

- [x] Update section role permissions in [`ConfigRegistryLoader.jsx`](file:///home/jmro/secretary-app/client/src/features/config/components/ConfigRegistryLoader.jsx) to grant `['admin', 'secretary']` on `modules`, `communications`, `integrations`, and `billing`.
- [x] Verify tab authorization and query fallback behavior in [`SystemConfigPage.jsx`](file:///home/jmro/secretary-app/client/src/features/config/pages/SystemConfigPage.jsx).

## Phase 2: BillingSettings Component Refactor

- [x] Refactor [`BillingSettings.jsx`](file:///home/jmro/secretary-app/client/src/features/config/components/sections/BillingSettings.jsx):
  - [x] Add global fiscal environment selector (`afip_environment`: `testing` / `production`).
  - [x] Implement AFIP server health check verification action and status display.
  - [x] Fetch doctor list and render Doctor Fiscal Status overview table (CUIT, POS, Certificate/Key presence, `Ready` / `Incomplete` status badge).
  - [x] Integrate action button to open [`DoctorEditModal.jsx`](file:///home/jmro/secretary-app/client/src/features/doctors/components/modals/DoctorEditModal.jsx) focused on fiscal configuration.
- [x] Update [`BillingSettings.module.css`](file:///home/jmro/secretary-app/client/src/features/config/components/sections/BillingSettings.module.css) with table, status badges, and action button styles.

## Phase 3: Automated Tests

- [x] Update [`ConfigRegistryLoader.test.jsx`](file:///home/jmro/secretary-app/client/src/features/config/components/ConfigRegistryLoader.test.jsx) with role verification tests for `admin` and `secretary` across all 4 configuration sections.
- [x] Create unit tests in [`BillingSettings.test.jsx`](file:///home/jmro/secretary-app/client/src/features/config/components/sections/BillingSettings.test.jsx):
  - [x] Test environment toggle triggering clinic settings update.
  - [x] Test AFIP connection check handling success and error states.
  - [x] Test doctor fiscal matrix rendering complete (`Ready`) vs incomplete (`Incomplete`) statuses.
  - [x] Test clicking doctor edit action opens modal with doctor data.

## Phase 4: Verification & Quality Checks

- [x] Run test suite: `npm test` or `npx vitest run client/src/features/config/`.
- [x] Run linter and formatting: `npm run lint`.
- [x] Run frontend build check: `npm run build`.
