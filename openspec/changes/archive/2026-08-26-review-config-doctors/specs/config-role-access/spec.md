# Delta for Config Role Access

## ADDED Requirements

### Requirement: Server-Side Settings Write Authorization (Coarse RBAC)

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
