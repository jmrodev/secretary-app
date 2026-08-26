# Spec: Configuration Role Access & Tab Authorization

## Purpose

Defines role-based access control across system configuration tabs in `ConfigRegistryLoader` and `SystemConfigPage`, ensuring `admin` and `secretary` roles have appropriate access across configuration registry sections while restricting unauthorized roles.

## Requirements

### Requirement 1: Configuration Registry Role Definitions
- `ConfigRegistryLoader` MUST register all configuration sections with explicit `allowedRoles`:
  - `modules`: `['admin']`
  - `communications`: `['secretary']`
  - `integrations`: `['admin']`
  - `billing`: `['admin', 'secretary']`
- Any configuration section lacking the current user's role in its `allowedRoles` MUST NOT be rendered in the configuration navigation sidebar.

#### Scenario: Admin user loads configuration registry
- GIVEN an authenticated user with role `admin`
- WHEN the configuration registry loads on `/config`
- THEN `modules`, `integrations`, and `billing` tabs MUST be available and visible, and `communications` tab MUST NOT be rendered.

#### Scenario: Secretary user loads configuration registry
- GIVEN an authenticated user with role `secretary`
- WHEN the configuration registry loads on `/config`
- THEN `communications` and `billing` tabs MUST be available and visible, and `modules` and `integrations` tabs MUST NOT be rendered.

---

### Requirement 2: Tab Authorization & Query Param Fallback
- `SystemConfigPage` MUST evaluate the requested `?tab=<key>` query parameter against the current user's role.
- If the requested tab is not allowed for the user's role, `SystemConfigPage` MUST fallback to the first allowed registered tab for that role.
- If the requested tab does not exist in the registry, `SystemConfigPage` MUST fallback to the first allowed registered tab.

#### Scenario: User requests unauthorized tab directly via URL
- GIVEN an authenticated user whose role is not permitted for a specific registered tab
- WHEN the user navigates directly to `/config?tab=restricted_section`
- THEN `SystemConfigPage` MUST active the first permitted tab (e.g., `modules`) without throwing errors.

#### Scenario: User requests nonexistent tab query parameter
- GIVEN an authenticated `admin` or `secretary` user
- WHEN the user navigates to `/config?tab=nonexistent`
- THEN `SystemConfigPage` MUST render a visible "Tab not found" message with a link to the first allowed tab, and MUST NOT throw (explicit fallback instead of silent blank/redirect).

---

### Requirement 3: Route Level Protection for Configuration
- The `/config` route MUST be protected by `RoleGuard` allowing only `['admin', 'secretary']`.
- Clinical roles without system administration duties (`doctor`, `patient`) MUST be prevented from accessing `/config`.

#### Scenario: Doctor attempts to access `/config`
- GIVEN an authenticated user with role `doctor`
- WHEN the user navigates to `/config`
- THEN `RoleGuard` MUST deny access and redirect the user to their default authorized landing page (`/dashboard` or `/appointments`).

---

### Requirement 4: Server-Side Settings Write Authorization (Coarse RBAC)

The `POST /settings` endpoint MUST authorize writes using the coarse `ACCESS_LEVELS.MANAGE_CORE_DATA` role list, not granular `can_*` permission flags.
- `server/routes/system/settingsRoutes.js` MUST protect `POST /` with `authorize(ACCESS_LEVELS.MANAGE_CORE_DATA)`.
- `server/constants/roles.js` MUST include `ROLES.SECRETARY` (e.g., Stella) in the `MANAGE_CORE_DATA` allow-list.
- Granular secretary permissions (`can_manage_users`, `can_crud_*`) MUST NOT gate `POST /settings`; a secretary with all granular flags `false` MUST still be permitted to save settings.
- The `authorize` middleware MUST perform a pure role check against the JWT `req.user.role`, independent of the granular permissions payload.

#### Scenario: Secretary saves a global setting
- GIVEN an authenticated `secretary` (e.g., Stella) with `can_manage_users=false` and all `can_crud_*=false`
- WHEN the secretary submits `POST /settings` with `{ key: 'afip_environment', value: 'production' }`
- THEN the server MUST authorize the request (HTTP 200) and persist the value.

#### Scenario: Doctor is denied settings write
- GIVEN an authenticated `doctor` role
- WHEN the doctor submits `POST /settings`
- THEN the server MUST deny the request (HTTP 403) because `doctor` is not in `MANAGE_CORE_DATA`.

#### Scenario: Granular flags do not override coarse role check
- GIVEN an authenticated `secretary` whose granular permission flags are all false
- WHEN the secretary saves any core setting via `ConfigContext.updateSetting`
- THEN the optimistic client save and the server write both succeed, proving coarse RBAC governs, not granular flags.
