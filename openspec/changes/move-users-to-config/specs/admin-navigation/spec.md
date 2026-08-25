## Purpose

Defines the navigation structure for administrative management tasks, specifically focusing on the relocation of User Management into the System Configuration area.

## Requirements

### Requirement: Admin User Management Navigation

The system MUST NOT display a dedicated "Users" link in the main application navigation bar. Instead, user management MUST be accessible as a distinct tab within the System Configuration (`/config?tab=users`).

#### Scenario: Admin views main navigation

- GIVEN an authenticated user with the `admin` role
- WHEN they view the main navigation bar
- THEN the "Users" link MUST NOT be present
- AND the "Patients" link MUST remain present

#### Scenario: Admin accesses User Management

- GIVEN an authenticated user with the `admin` role
- WHEN they navigate to the Configuration section
- THEN they MUST see and be able to select the "Users" tab to manage users.

#### Scenario: Secretary views main navigation

- GIVEN an authenticated user with the `secretary` role
- WHEN they view the main navigation bar
- THEN the "Users" link MUST NOT be present.

### Requirement: Deprecation of Legacy Route

The standalone `/admin/users` route MUST be deprecated and removed from the active router configuration, funneling all user management traffic through the configuration page framework.

#### Scenario: User navigates to legacy user management route

- GIVEN any authenticated user
- WHEN they attempt to access `/admin/users` directly
- THEN the system SHOULD return a standard 404 Not Found or redirect them to an appropriate authorized page.
