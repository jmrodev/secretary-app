# Proposal: Granular Secretary Permissions Matrix (RBAC)

## Intent

Currently, operational secretary capabilities (such as managing users, modifying past appointments, editing prescriptions, licenses, medical requests, patient files, and financial records) are governed either by a single user flag (`can_manage_users`) or by global system-wide switches in `system_settings` (e.g. `enable_secretary_crud_appointments`, `allow_secretary_edit_past_appointments`, `enable_secretary_crud_prescriptions`, `enable_secretary_crud_licenses`, `enable_secretary_crud_files`, `enable_secretary_finance_crud`).

This global toggle model poses significant operational risks and flexibility constraints: granting a permission globally enables it for *all* secretaries regardless of seniority or trust level. The goal of this change is to replace global system-wide secretary toggles with a granular, per-secretary Role-Based Access Control (RBAC) permissions matrix stored in the database, verified via authorization middleware in backend APIs, and managed via an individual "Permissions" modal per secretary in `/admin/users`.

## Scope

### In Scope
- **Database Schema**:
  - Add granular boolean permission columns to the `users` table:
    - `can_manage_users` (existing)
    - `can_crud_appointments` (new)
    - `can_edit_past_appointments` (new)
    - `can_crud_requests` (new)
    - `can_crud_prescriptions` (new)
    - `can_crud_licenses` (new)
    - `can_crud_files` (new)
    - `can_crud_finances` (new)
  - Safe migration script to add columns and default existing secretaries based on current global settings.
- **Backend API & Middleware**:
  - Update `AuthService` token generation (`_generateToken`) and login payload to include granular permissions in JWT and user response.
  - Refactor `server/middleware/authorize.js` to provide route middleware for fine-grained secretary permissions (e.g. `authorizePermission('can_crud_appointments')`).
  - Refactor service authorization checks in `LicenseService`, `MedicalFileService`, `PrescriptionService`, `MedicalRequestService`, `appointmentHelper`, and `financeService` / `billingService` to inspect the acting secretary user's specific permissions instead of global `system_settings`.
  - Update `GET /admin/users/permissions` and `POST /admin/users/permissions` (or `PUT /admin/users/:id/permissions`) to fetch and update granular permissions per secretary.
  - Invalidate active sessions upon permission changes by bumping `token_version`.
- **Frontend UI & State**:
  - In `/admin/users` (`AdminUsersPage.jsx`):
    - Remove the obsolete `SecretaryGlobalPermissionsPanel` sidebar component.
    - Remove the bulk `SecretaryPermissionsPanel` sidebar component.
    - Clean up the sidebar layout to focus on actions and navigation.
  - In `UserTable.jsx`:
    - Add a "Permissions" action button for secretaries (e.g., `<Icon name="security" />` / `<Icon name="tune" />`).
    - Render informative badge pills in the `Permissions` column showing individual granted permissions or compact summary tags.
  - Create `SecretaryPermissionsModal.jsx`:
    - Modular checkbox grid for all 8 granular permissions.
    - Clear labels, descriptive helper text, and save/cancel actions.
  - Update `usePermissions.js` and `useAuth.js`:
    - Read user permissions directly from the authenticated user object / token rather than querying `/settings` on mount.
  - Clean up obsolete translation keys and add new localization keys for the 8 permissions.

### Out of Scope
- Dynamic creation of custom arbitrary roles (roles remain `admin`, `secretary`, `doctor`, `patient`).
- Doctor or Patient granular permission matrices (doctor and patient access rules remain role- and ownership-based).
- Multi-tenancy or organization-level permission scoping.

## Capabilities

### New Capabilities
- `granular-secretary-rbac`: Individual secretaries possess dedicated boolean flags for each sensitive operational capability, queryable and updatable by administrators.
- `secretary-permissions-modal`: A dedicated modal dialog in `/admin/users` allowing administrators to inspect and toggle specific operational rights per secretary.

### Modified Capabilities
- `user-management`: The admin users screen displays granular permission badges per user row and manages permissions via an individual modal instead of global sidebar toggles.
- `permission-authorization`: Backend authorization checks (middleware and service guards) evaluate the authenticated user's specific permissions instead of querying `system_settings`.
- `client-permissions-hook`: `usePermissions` hook evaluates user-level permission flags locally without network polling to global settings endpoints.

## Approach

1. **Database Schema & Migration**:
   - Add columns to `users`:
     ```sql
     ALTER TABLE users
       ADD COLUMN can_crud_appointments TINYINT(1) NOT NULL DEFAULT 0,
       ADD COLUMN can_edit_past_appointments TINYINT(1) NOT NULL DEFAULT 0,
       ADD COLUMN can_crud_requests TINYINT(1) NOT NULL DEFAULT 0,
       ADD COLUMN can_crud_prescriptions TINYINT(1) NOT NULL DEFAULT 0,
       ADD COLUMN can_crud_licenses TINYINT(1) NOT NULL DEFAULT 0,
       ADD COLUMN can_crud_files TINYINT(1) NOT NULL DEFAULT 0,
       ADD COLUMN can_crud_finances TINYINT(1) NOT NULL DEFAULT 0;
     ```
   - Initialize values for existing secretary users to preserve operational continuity.

2. **Backend Authentication & Authorization**:
   - Update `AuthService._generateToken` and `login` to embed the permission dictionary or flags into the JWT payload (`permissions: { can_manage_users, can_crud_appointments, ... }`).
   - Create generic middleware helper `authorizePermission(permissionFlag)` in `server/middleware/authorize.js`:
     - Allows `admin` unconditionally.
     - For `secretary`, verifies `req.user.permissions?.[permissionFlag] === true` or `req.user[permissionFlag] === true`.
     - Returns `403 Forbidden` if missing.
   - Refactor service-level authorization guards (e.g. `LicenseService._checkPermissions`, `MedicalFileService.deleteFile`, `appointmentHelper.checkModificationPermissions`, `billingService`/transactions) to use `user.permissions` / `user[flag]`.

3. **Backend API Endpoints**:
   - Expand `userRepository` and `UserAccountService`:
     - `getSecretaryPermissions(userId)`: returns all 8 boolean flags for a secretary or all secretaries.
     - `updateSecretaryPermissions(userId, permissions)`: updates the boolean flags in `users`, increments `token_version` to evict stale JWTs, and logs the audit event.
   - Support both single-secretary updates (`PUT /admin/users/:id/permissions`) and bulk/list fetching (`GET /admin/users/permissions`).

4. **Frontend Architecture & Components**:
   - Create `client/src/features/users/components/SecretaryPermissionsModal.jsx` using Atomic Design modal conventions (`Modal`, `Toggle`/`Checkbox`, `Button`).
   - Update `UserTable.jsx` to show permission badges (e.g. `Usuarios`, `Turnos`, `Turnos Pasados`, `Solicitudes`, `Recetas`, `Licencias`, `Archivos`, `Finanzas`) and an action button to open `SecretaryPermissionsModal`.
   - In `AdminUsersPage.jsx`, remove `SecretaryGlobalPermissionsPanel` and `SecretaryPermissionsPanel` from the sidebar.
   - In `client/src/hooks/usePermissions.js`, simplify logic: admins receive `true` for all flags; secretaries receive flags mapped directly from `user.permissions` / `user` properties.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `server/01-schema.sql` & migrations | Modified | Add granular permission columns to `users` table |
| `server/repositories/user/userRepository.js` | Modified | Query and persist granular permission columns |
| `server/services/user/authService.js` | Modified | Embed granular permissions in JWT payload and login response |
| `server/services/user/UserAccountService.js` | Modified | Manage granular permissions per secretary and token eviction |
| `server/controllers/user/userAccountController.js` | Modified | Expose endpoints to get and update granular secretary permissions |
| `server/routes/user/userRoutes.js` | Modified | Add/update routes for secretary granular permissions |
| `server/middleware/authorize.js` | Modified | Add `authorizePermission(permissionName)` middleware |
| `server/services/medical/LicenseService.js` | Modified | Authorize using user's `can_crud_licenses` |
| `server/services/medical/MedicalFileService.js` | Modified | Authorize using user's `can_crud_files` |
| `server/services/medical/PrescriptionService.js` | Modified | Authorize using user's `can_crud_prescriptions` |
| `server/services/medical/MedicalRequestService.js` | Modified | Authorize using user's `can_crud_requests` |
| `server/services/appointments/appointmentHelper.js` | Modified | Authorize using user's `can_crud_appointments` & `can_edit_past_appointments` |
| `server/routes/finance/financeRoutes.js` | Modified | Authorize using user's `can_crud_finances` |
| `client/src/features/users/AdminUsersPage.jsx` | Modified | Remove global toggles panel and bulk panel from sidebar |
| `client/src/features/users/components/SecretaryGlobalPermissionsPanel.*` | Removed/Deprecated | Obsolete global settings switches removed |
| `client/src/features/users/components/SecretaryPermissionsPanel.*` | Replaced | Replaced by individual permissions modal |
| `client/src/features/users/components/SecretaryPermissionsModal.jsx` | **New** | Modal dialog to configure individual secretary permissions |
| `client/src/features/users/components/UserTable.jsx` | Modified | Add Permissions action button and permission badges |
| `client/src/hooks/usePermissions.js` | Modified | Read permissions directly from current user session |
| `client/src/constants/languages/` | Modified | Add localization keys for granular permissions and modal UI |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing secretary sessions lose permissions immediately after migration | Medium | Run migration with initial grants matching current `system_settings` and increment `token_version` so users seamlessly re-authenticate with full permissions |
| Stale JWT tokens holding old permission claims | Low | Every permission update increments `token_version`, triggering automatic token eviction via `authMiddleware` |
| Missing authorization checks in obscure legacy endpoints | Low | Centralize permission checks in `authorize.js` and conduct audit of medical, appointment, and finance routes |

## Rollback Plan

1. **Database Rollback**:
   - Revert schema changes by dropping added columns or keeping them nullable:
     ```sql
     ALTER TABLE users
       DROP COLUMN can_crud_appointments,
       DROP COLUMN can_edit_past_appointments,
       DROP COLUMN can_crud_requests,
       DROP COLUMN can_crud_prescriptions,
       DROP COLUMN can_crud_licenses,
       DROP COLUMN can_crud_files,
       DROP COLUMN can_crud_finances;
     ```
2. **Server Rollback**:
   - Revert server commits to restore global `system_settings` checks in services.
3. **Frontend Rollback**:
   - Revert client commits to restore `SecretaryGlobalPermissionsPanel` and `usePermissions` querying `/settings`.

## Dependencies

- Existing `token_version` eviction mechanism in `authMiddleware.js` (reused as-is).
- Existing `users` table and `secretaries` table relationships.
- Modal infrastructure (`client/src/components/molecules/Modal.jsx` or similar).

## Success Criteria

- [ ] Database schema includes all 8 boolean permission columns on `users` table.
- [ ] Admin can view and edit granular permissions for any individual secretary in `/admin/users` via a dedicated modal.
- [ ] Modifying a secretary's permissions takes effect immediately on their next request (or re-login via `token_version` bump).
- [ ] `UserTable` displays accurate granted permission badges for each secretary row.
- [ ] Obsolete global secretary permission toggles sidebar panel is completely removed.
- [ ] Backend routes (appointments, requests, prescriptions, licenses, files, finances, users) strictly enforce individual secretary permissions instead of global system settings.
- [ ] Existing automated unit and integration tests pass, and new tests cover granular authorization middleware and endpoints.
