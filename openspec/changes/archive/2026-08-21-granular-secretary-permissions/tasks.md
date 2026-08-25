# Tasks: Granular Secretary Permissions Matrix (RBAC)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~950–1,250 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Database & Backend Core → Domain Services & Authorization → Frontend Modal & UserTable → Integration & E2E Tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes  
Chained PRs recommended: Yes  
Chain strategy: pending  
400-line budget risk: High  

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | DB Schema + Migration + UserRepository & Core Auth/JWT | PR 1 | `pnpm --filter server test authService` | Seed users, run migration, test token payload & eviction | Revert server commit + `DROP COLUMN` SQL |
| 2 | Route Middleware & Domain Services Refactor | PR 2 | `pnpm --filter server test authorize` | Execute appointment/license/prescription CRUD with different secretary permission sets | Revert server domain services commit |
| 3 | Frontend Permissions Modal, UserTable Badges & usePermissions | PR 3 | `pnpm --filter client test` | Open `/admin/users`, toggle secretary permissions in modal, inspect table badges | Revert client commit |
| 4 | Verification, Automated Integration & E2E Tests | PR 4 | `pnpm test` | Run full test suite across server and client | Revert test-only commit |

---

## Phase 1: Database Migration & Schema

- [x] 1.1 Create migration script `server/scripts/migrations/26_granular_secretary_permissions.sql` adding columns `can_crud_appointments`, `can_edit_past_appointments`, `can_crud_requests`, `can_crud_prescriptions`, `can_crud_licenses`, `can_crud_files`, `can_crud_finances` to `users` table and populating initial values from `system_settings` for existing secretaries.
- [x] 1.2 Update base schema definition in `server/01-schema.sql` to include the 7 new boolean columns with default `0` on the `users` table.
- [x] 1.3 Create constants file `server/constants/permissions.js` defining `PERMISSION_KEYS` and `PERMISSION_CAMEL_MAP`.
- [x] 1.4 Update `server/repositories/user/userRepository.js`:
  - Update `findAllStaff` query to select all 8 permission flags (`can_manage_users`, `can_crud_appointments`, `can_edit_past_appointments`, `can_crud_requests`, `can_crud_prescriptions`, `can_crud_licenses`, `can_crud_files`, `can_crud_finances`).
  - Add `getSecretaryPermissions(userId, conn)` to fetch permissions for a single secretary or all secretaries.
  - Add `updatePermissions(userId, permissions, conn)` to update specified boolean columns and bump `token_version`.
- [x] 1.5 Add/update unit tests in `server/repositories/user/userRepository.test.js` covering granular permission queries and updates.

---

## Phase 2: Backend Core, Auth & Domain Middleware

- [x] 2.1 Update `server/services/user/authService.js`:
  - Update `_generateToken` to embed the full `permissions` object containing all 8 boolean flags into the JWT payload (and retain backwards-compatible `canManageUsers` alias).
  - Update `login` response payload to include user permissions dictionary.
- [x] 2.2 Refactor `server/middleware/authorize.js`:
  - Add `authorizePermission(permissionKey)` middleware that grants access unconditionally to `admin` and checks `user.permissions[permissionKey]` for `secretary`.
  - Maintain `authorizeCanManageUsers` as an alias using `authorizePermission('can_manage_users')`.
- [x] 2.3 Update `server/services/user/UserAccountService.js` and `server/controllers/user/userAccountController.js`:
  - Refactor `getSecretaryPermissions` and `updateSecretaryPermissions` to handle the full 8-permission matrix.
  - Add endpoint handlers for `GET /admin/users/:id/permissions` and `PUT /admin/users/:id/permissions` with validation for non-boolean or invalid payloads.
  - Register/update routes in `server/routes/user/userRoutes.js`.
- [x] 2.4 Refactor domain service authorization checks:
  - `server/services/appointments/appointmentHelper.js` & `server/services/appointments/appointmentService.js`: Check `can_crud_appointments` and `can_edit_past_appointments`.
  - `server/services/medical/PrescriptionService.js`: Check `can_crud_prescriptions`.
  - `server/services/medical/LicenseService.js`: Refactor `_checkPermissions` to check `can_crud_licenses`.
  - `server/services/medical/MedicalFileService.js`: Check `can_crud_files`.
  - `server/services/medical/MedicalRequestService.js`: Check `can_crud_requests`.
  - `server/routes/finance/financeRoutes.js` / financial services: Guard transactions with `authorizePermission('can_crud_finances')`.

---

## Phase 3: Frontend Components, Modal & UserTable Integration

- [x] 3.1 Create `client/src/features/users/components/SecretaryPermissionsModal.jsx` and module styles `SecretaryPermissionsModal.module.css`:
  - Render an atomic modal dialog with 8 checkboxes/toggles for granular permissions with localized labels and descriptions.
  - Handle form state, save action via `PUT /admin/users/:id/permissions`, error notifications, and modal close.
- [x] 3.2 Update `client/src/features/users/components/UserTable.jsx`:
  - Render permission badge pills in the `Permissions` column for secretary accounts reflecting granted permissions.
  - Add "Permissions" action button (tune/security icon) per secretary row to launch `SecretaryPermissionsModal`.
- [x] 3.3 Remove obsolete sidebar panels:
  - Remove `SecretaryGlobalPermissionsPanel.jsx` and `SecretaryPermissionsPanel.jsx` from `client/src/features/users/components/` and delete their test files.
  - Clean up `client/src/features/users/AdminUsersPage.jsx` and `client/src/features/users/index.js` removing sidebar references to obsolete panels.
- [x] 3.4 Refactor `client/src/hooks/usePermissions.js`:
  - Evaluate user permissions synchronously from `useAuth().user` and JWT claims without making HTTP calls to `/settings`.
  - Expose camelCase permission booleans (`canCrudAppointments`, `canEditPastAppointments`, `canCrudRequests`, `canCrudPrescriptions`, `canCrudLicenses`, `canCrudFiles`, `canCrudFinances`, `canManageUsers`).
- [x] 3.5 Update localization files in `client/src/constants/languages/` with translation keys for all 8 permissions, modal descriptions, and table badges.

---

## Phase 4: Verification & Automated Tests

- [x] 4.1 Unit Tests (Backend):
  - `server/middleware/authorize.test.js`: Test `authorizePermission` for `admin` (bypass), authorized `secretary`, unauthorized `secretary` (403), and other roles.
  - `server/services/user/authService.test.js`: Test JWT payload generation with permissions and token verification.
  - `server/services/user/UserAccountService.test.js` & `server/controllers/__tests__/userAccountController.test.js`: Test permission fetch, granular update, validation error handling (400), and non-admin denial (403).
  - Domain service tests: Verify permission checks in `appointmentHelper.test.js`, `LicenseService.test.js`, and `MedicalFileService.test.js`.
- [x] 4.2 Unit / Component Tests (Frontend):
  - `client/src/features/users/components/SecretaryPermissionsModal.test.jsx`: Test modal rendering, toggling permissions, save payload dispatch, and cancel behavior.
  - `client/src/features/users/components/UserTable.test.jsx`: Test rendering of granular permission badges and modal trigger button.
  - `client/src/hooks/usePermissions.test.js`: Test synchronous evaluation for admin, secretary, and unprivileged users.
- [x] 4.3 Integration & Regression Verification:
  - Test session eviction flow: updating a secretary's permissions bumps `token_version` and invalidates previous JWT tokens on subsequent requests.
  - Run full test suites: `pnpm --filter server test` and `pnpm --filter client test`.
  - Run linter and formatting checks: `pnpm lint`.
