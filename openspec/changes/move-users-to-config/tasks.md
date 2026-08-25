## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 50 - 100 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Migrate users to config | PR 1 | `npm run test` | `npm run dev` | Revert PR 1 |

## Phase 1: Foundation & Core Implementation

- [x] 1.1 `client/src/features/layout/components/Navbar.jsx`: Remove the `users` route from the navigation array.
- [x] 1.2 `client/src/features/users/AdminUsersPage.jsx`: Remove `<MainLayout>` wrapper, rename `searchParams.get('tab')` to `searchParams.get('subtab')`, and update the `switchTab` parameter logic to prevent URL collisions.
- [x] 1.3 `client/src/features/config/components/ConfigRegistryLoader.jsx`: Lazy load `AdminUsersPage`, create `UsersSettingsWrapper`, and register `users` section for `admin` role.
- [x] 1.4 `client/src/routes/AppRouter.jsx`: Replace `<Route path="/admin/users">` with a `<Navigate to="/config?tab=users" replace />` and update `/doctors` redirect to `/config?tab=users&subtab=doctor`.

## Phase 2: Testing

- [x] 2.1 Verify `AdminUsersPage` correctly parses and updates `?subtab=` in the URL without touching `?tab=`.
- [x] 2.2 Verify `ConfigRegistryLoader` correctly registers the users config section only for the `admin` role.
- [x] 2.3 Verify `AppRouter` correctly redirects `/admin/users` to `/config?tab=users` and `/doctors` to `/config?tab=users&subtab=doctor`.
- [x] 2.4 E2E Test: Admin users can log in, "Users" is absent from navbar, "Users" is present in Config tab, and admin can manage users.
