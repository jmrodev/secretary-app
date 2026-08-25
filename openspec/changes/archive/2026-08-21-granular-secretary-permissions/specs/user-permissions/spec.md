# User Permissions Specification

## Purpose

Defines the granular Role-Based Access Control (RBAC) permissions matrix for secretary users, replacing system-wide switches with per-secretary configuration. It governs permission storage, session token claims, route authorization middleware, service-level guards, token eviction upon permission updates, and admin user interface controls.

## Requirements

### Requirement: Granular Permission Schema and User Association

The system MUST store 8 distinct operational boolean permissions directly on each user account record in the database:
1. `can_manage_users`
2. `can_crud_appointments`
3. `can_edit_past_appointments`
4. `can_crud_requests`
5. `can_crud_prescriptions`
6. `can_crud_licenses`
7. `can_crud_files`
8. `can_crud_finances`

Each permission column MUST default to `0` (false) for newly created users unless explicitly granted.

#### Scenario: Admin creates secretary without specific permissions
- GIVEN an administrator creates a new secretary user account
- WHEN no explicit permissions are supplied during creation
- THEN all 8 granular permission flags MUST evaluate to `false` (`0`) for that secretary.

#### Scenario: Admin creates secretary with explicit permissions
- GIVEN an administrator creates a new secretary user account
- WHEN explicit permissions (e.g. `can_crud_appointments = true`, `can_crud_prescriptions = true`) are supplied
- THEN the specified permissions MUST be persisted as `true` and remaining permissions MUST default to `false`.

---

### Requirement: Granular Permission Assignment and Updates

Administrators MUST be able to query and update any secretary's granular permissions via admin user management endpoints (`GET /admin/users/permissions`, `GET /admin/users/:id/permissions`, and `PUT /admin/users/:id/permissions`). Non-admin users attempting to modify permissions MUST be rejected with HTTP 403 Forbidden.

#### Scenario: Admin successfully updates secretary permissions (Happy Path)
- GIVEN an authenticated user with role `admin` and an existing secretary user with ID `123`
- WHEN the admin sends `PUT /admin/users/123/permissions` with a payload updating any subset of the 8 permission flags
- THEN the user record in the database MUST be updated with the new boolean values
- AND the operation MUST increment the target secretary's `token_version`
- AND the server MUST return HTTP 200 OK with the updated permission dictionary.

#### Scenario: Secretary or unprivileged user attempts to update permissions
- GIVEN an authenticated user with role `secretary` or `patient`
- WHEN they attempt to call `PUT /admin/users/:id/permissions`
- THEN the request MUST be rejected with HTTP 403 Forbidden
- AND no database changes or token version increments MUST occur.

#### Scenario: Admin updates permissions for non-existent user
- GIVEN an authenticated user with role `admin`
- WHEN the admin sends `PUT /admin/users/999999/permissions` for a user ID that does not exist
- THEN the server MUST return HTTP 404 Not Found
- AND no token eviction or audit records for that ID MUST be created.

#### Scenario: Admin updates permissions with invalid payload
- GIVEN an authenticated user with role `admin`
- WHEN the admin sends `PUT /admin/users/:id/permissions` with non-boolean values or malformed parameters
- THEN the server MUST reject the payload with HTTP 400 Bad Request
- AND the target user's current permissions MUST remain unchanged.

---

### Requirement: Token Payload and Eviction Lifecycle

JWT generation (`AuthService._generateToken`) and login responses MUST embed the full dictionary of granular permissions for the user. When a secretary's permissions are updated by an administrator, the target user's `token_version` MUST be incremented, immediately evicting existing active tokens on subsequent authenticated requests.

#### Scenario: Secretary logs in and receives granular permissions
- GIVEN an active secretary user with `can_crud_appointments = true` and `can_crud_files = false`
- WHEN the secretary authenticates via `POST /auth/login`
- THEN the issued JWT payload and the response `user` object MUST contain `permissions` including `can_crud_appointments: true` and `can_crud_files: false`.

#### Scenario: Active secretary token evicted following permission update
- GIVEN an active secretary with a valid JWT token with `token_version = 1`
- WHEN an administrator updates the secretary's permissions, incrementing `token_version` to `2`
- THEN any subsequent API request using the old token with `token_version = 1` MUST be rejected by `authMiddleware` with HTTP 401 Unauthorized
- AND the secretary MUST re-authenticate to obtain a new token containing the updated permissions.

---

### Requirement: Route Middleware Authorization

The server MUST provide an `authorizePermission(permissionFlag)` middleware in `server/middleware/authorize.js`.
- Users with role `admin` MUST always be authorized unconditionally.
- Users with role `secretary` MUST be authorized IF AND ONLY IF their authenticated identity contains `true` for the specified `permissionFlag`.
- Users lacking the required permission MUST be rejected with HTTP 403 Forbidden.

#### Scenario: Admin accesses guarded endpoint
- GIVEN an authenticated user with role `admin`
- WHEN the admin requests an endpoint guarded by `authorizePermission('can_crud_licenses')`
- THEN the middleware MUST allow the request to proceed regardless of explicit boolean flags.

#### Scenario: Secretary with granted permission accesses guarded endpoint
- GIVEN an authenticated secretary with `can_crud_licenses = true`
- WHEN the secretary requests an endpoint guarded by `authorizePermission('can_crud_licenses')`
- THEN the middleware MUST allow the request to proceed to the route controller.

#### Scenario: Secretary without granted permission accesses guarded endpoint
- GIVEN an authenticated secretary with `can_crud_licenses = false`
- WHEN the secretary requests an endpoint guarded by `authorizePermission('can_crud_licenses')`
- THEN the middleware MUST halt execution and respond with HTTP 403 Forbidden and an error message indicating insufficient privileges.

---

### Requirement: Service-Level Authorization Guards

Backend service layers handling domain logic MUST inspect the acting secretary's granular permissions rather than global `system_settings` switches.

1. **Appointments & Past Appointments** (`appointmentHelper` / `appointmentService`):
   - Modifying, deleting, or rescheduling appointments MUST verify `can_crud_appointments`.
   - Modifying appointments in the past MUST additionally verify `can_edit_past_appointments`.
2. **Medical Requests** (`MedicalRequestService`):
   - Creating, modifying, or deleting medical requests MUST verify `can_crud_requests`.
3. **Prescriptions** (`PrescriptionService`):
   - Creating, modifying, or deleting prescriptions MUST verify `can_crud_prescriptions`.
4. **Medical Licenses** (`LicenseService`):
   - Creating, modifying, or deleting licenses MUST verify `can_crud_licenses`.
5. **Medical Files** (`MedicalFileService`):
   - Uploading or deleting patient medical files MUST verify `can_crud_files`.
6. **Finances & Billing** (`financeService` / `billingService`):
   - Creating or updating financial transactions and cash registers MUST verify `can_crud_finances`.

#### Scenario: Secretary attempts to edit past appointment with past appointment permission
- GIVEN an authenticated secretary with `can_crud_appointments = true` and `can_edit_past_appointments = true`
- WHEN the secretary attempts to modify an appointment whose start date is in the past
- THEN the service authorization checks MUST succeed and allow the modification.

#### Scenario: Secretary attempts to edit past appointment without past appointment permission
- GIVEN an authenticated secretary with `can_crud_appointments = true` and `can_edit_past_appointments = false`
- WHEN the secretary attempts to modify an appointment whose start date is in the past
- THEN the service authorization check MUST throw a Forbidden / 403 error preventing the past appointment update.

#### Scenario: Secretary attempts medical file deletion without file permission
- GIVEN an authenticated secretary with `can_crud_files = false`
- WHEN the secretary attempts to delete a patient medical file in `MedicalFileService`
- THEN the service MUST reject the operation with a Forbidden error.

---

### Requirement: Admin UI Permissions Modal and Table Badges

The admin user management interface (`/admin/users`) MUST provide visual indicators and individual management controls for secretary permissions:
1. `UserTable.jsx` MUST render badge pills in the Permissions column representing each granted permission for secretary rows (e.g. `Turnos`, `Recetas`, `Licencias`, `Archivos`, `Finanzas`, etc.).
2. `UserTable.jsx` MUST provide a "Permissions" action button for each secretary row that opens the `SecretaryPermissionsModal`.
3. `SecretaryPermissionsModal.jsx` MUST display a toggle or checkbox for each of the 8 granular permissions with clear labels and helper descriptions.
4. Saving changes in `SecretaryPermissionsModal` MUST persist updates via API and refresh the user list in the table.
5. Obsolete sidebar panels (`SecretaryGlobalPermissionsPanel` and bulk `SecretaryPermissionsPanel`) MUST be completely removed from `AdminUsersPage.jsx`.

#### Scenario: Admin views secretary rows in UserTable
- GIVEN an administrator viewing `/admin/users`
- WHEN a secretary has permissions `can_crud_appointments = true` and `can_crud_prescriptions = true`
- THEN `UserTable` MUST render badges indicating Appointment and Prescription management capabilities
- AND other ungranted capabilities MUST NOT be shown as active badges.

#### Scenario: Admin opens and saves permissions in SecretaryPermissionsModal
- GIVEN an administrator viewing the `/admin/users` table
- WHEN the admin clicks the "Permissions" action button for a secretary
- THEN `SecretaryPermissionsModal` MUST open displaying the current state of all 8 toggles
- AND WHEN the admin toggles `can_crud_finances` to `true` and clicks Save
- THEN the modal MUST call `PUT /admin/users/:id/permissions`
- AND on success, the modal MUST close and the `UserTable` MUST update to reflect the newly granted finance badge.

#### Scenario: Admin cancels changes in SecretaryPermissionsModal
- GIVEN an administrator has opened `SecretaryPermissionsModal` and toggled several permissions
- WHEN the admin clicks "Cancel" or closes the modal without saving
- THEN no API request MUST be sent and the secretary's permissions MUST remain unchanged.
