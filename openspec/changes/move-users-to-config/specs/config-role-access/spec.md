## MODIFIED Requirements

### Requirement 1: Configuration Registry Role Definitions

- `ConfigRegistryLoader` MUST register all configuration sections with explicit `allowedRoles`:
  - `modules`: `['admin']`
  - `communications`: `['secretary']`
  - `integrations`: `['admin']`
  - `billing`: `['admin', 'secretary']`
  - `users`: `['admin']`
- Any configuration section lacking the current user's role in its `allowedRoles` MUST NOT be rendered in the configuration navigation sidebar.

(Previously: The users tab was not included in the role definitions.)

#### Scenario: Admin user loads configuration registry

- GIVEN an authenticated user with role `admin`
- WHEN the configuration registry loads on `/config`
- THEN `modules`, `integrations`, `billing`, and `users` tabs MUST be available and visible, and `communications` tab MUST NOT be rendered.

#### Scenario: Secretary user loads configuration registry

- GIVEN an authenticated user with role `secretary`
- WHEN the configuration registry loads on `/config`
- THEN `communications` and `billing` tabs MUST be available and visible, and `modules`, `integrations`, and `users` tabs MUST NOT be rendered.
