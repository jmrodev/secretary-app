## Intent

Move the "Users" (Usuarios) management section into the "Configuration" area as a new tab. This refactoring removes user management from the main navigation flow to declutter it, as user management is an administrative task rather than a daily operational one. The "Patients" tab will remain in the main navigation.

## Scope

### In Scope
- Remove the "Users" link from the main navigation bar (`Navbar.jsx`).
- Register a new `users` configuration section (e.g. "Personal" or "Usuarios") in `ConfigRegistryLoader.jsx` available only for the `admin` role.
- Refactor `AdminUsersPage.jsx` to remove the nested `MainLayout` and adapt it to be rendered seamlessly as a tab within `SystemConfigPage.jsx` via the `ConfigRegistryLoader`.
- Update routing logic or layout so the `users` tab is properly accessible within the `/config` route context.

### Out of Scope
- Functional modifications to User, Doctor, or Secretary management logic (e.g. CRUD operations or permissions rules).
- Moving or altering the "Patients" (Pacientes) tab.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `admin-navigation`: (If it existed) - changing where admin user management is located.
- `config-role-access`: Updating the `ConfigRegistryLoader` and `allowedRoles` to include the `users` config tab strictly for `admin`.

## Approach

1. **Navigation Update**: Edit `client/src/features/layout/components/Navbar.jsx` to remove the navigation link for "Users".
2. **Refactor AdminUsersPage**: Modify `AdminUsersPage.jsx` to strip the `MainLayout` wrapping and any conflicting header elements, exposing it as a standard configuration tab component (e.g., `UsersSettingsWrapper`).
3. **Registry Update**: In `ConfigRegistryLoader.jsx`, import the newly refactored `AdminUsersPage` and register it using `registerConfigSection('users', { title: t('users'), icon: 'people', allowedRoles: ['admin'] }, UsersSettingsWrapper);`.
4. **Routing**: Remove or deprecate the standalone `/admin/users` route, ensuring all user management accesses go through `/config?tab=users`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/src/features/layout/components/Navbar.jsx` | Modified | Remove "Users" nav link |
| `client/src/features/users/AdminUsersPage.jsx` | Modified | Strip `MainLayout` wrapper for tab integration |
| `client/src/features/config/components/ConfigRegistryLoader.jsx` | Modified | Register the new `users` tab |
| `client/src/App.jsx` (or Routing file) | Modified | Update route definitions if necessary |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Admin users lose access to user management if config route is broken | Low | Ensure the fallback tab logic in `SystemConfigPage` defaults correctly and the `allowedRoles: ['admin']` rule works. |
| Nested layout styling conflicts | Low | Properly removing `MainLayout` from `AdminUsersPage` mitigates this. |

## Rollback Plan

Revert the commits modifying `Navbar.jsx`, `AdminUsersPage.jsx`, and `ConfigRegistryLoader.jsx`, restoring the standalone `/admin/users` route and navigation link.

## Dependencies

- None

## Success Criteria

- [ ] "Users" is no longer visible in the main navigation.
- [ ] Navigating to Configuration shows a "Users" (or "Personal") tab for `admin` users.
- [ ] Admin users can successfully manage secretaries and doctors from the new Configuration tab.
- [ ] Secretary users do not see the "Users" configuration tab.

## Proposal Question Round

*If any of these assumptions conflict with current business rules, please review:*
1. Is the `users` tab strictly for `admin` roles, or should `secretary` roles with `can_manage_users` permission also see this tab?
2. Should we keep a redirect from `/admin/users` to `/config?tab=users` for users who might have bookmarked the page?
3. Should the tab be labelled "Usuarios" or "Personal"?
