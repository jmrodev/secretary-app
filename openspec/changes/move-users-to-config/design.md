</Agent System Instructions>
<Design: Move Users to Config>
## Technical Approach

We will migrate the User Management functionality out of the main navigation and into the System Configuration interface. This involves refactoring `AdminUsersPage.jsx` to remove its independent layout (`MainLayout`) so it can be injected seamlessly as a configuration tab content view. To prevent query parameter conflicts with the global configuration tab controller, `AdminUsersPage`'s internal tab state will be migrated from `?tab=` to `?subtab=`. The new component will be registered in `ConfigRegistryLoader.jsx` under the `users` key, strictly restricted to the `admin` role. The `AppRouter.jsx` will be updated to replace the old `/admin/users` route with a `Navigate` redirect to `/config?tab=users`, preserving backward compatibility for existing bookmarks.

## Architecture Decisions

### Decision: Internal Tab State Query Parameter Rename

**Choice**: Rename the query parameter used for inner tab switching inside `AdminUsersPage.jsx` from `tab` to `subtab`.
**Alternatives considered**: Use local component state (`useState`) and abandon deep linking for inner tabs.
**Rationale**: `SystemConfigPage.jsx` utilizes `?tab=` to determine which configuration section is active. Keeping `?tab=` inside `AdminUsersPage` would cause a collision, where switching to "doctors" would overwrite `?tab=users` to `?tab=doctor`, unmounting the users configuration tab entirely. Changing to `subtab` preserves the ability to deep-link directly to the doctors table without URL collisions.

### Decision: Component Cohesion vs. Directory Structure

**Choice**: Keep `AdminUsersPage.jsx` inside `client/src/features/users/` but adapt its structure to fulfill the contract of a Configuration section.
**Alternatives considered**: Move the component to `client/src/features/config/components/sections/`.
**Rationale**: The file imports extensively from `users`, `doctors`, and `appointments` domains. Leaving it within the `users` feature directory aligns with domain-driven design, while `ConfigRegistryLoader` correctly acts as the boundary orchestrator to pull it into the configuration UI.

## Data Flow

    [Navbar] ──(Removes Users Link)──┐
                                     │
    [AppRouter] ──(Redirects)──> [SystemConfigPage]
                                     │
                                     └──> [ConfigRegistryLoader]
                                                  │
                                                  └──(Renders users tab)──> [AdminUsersPage] (Without MainLayout)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `client/src/features/layout/components/Navbar.jsx` | Modify | Remove the navigation object for `/admin/users` from the `navLinks` array to ensure it no longer appears in the top-level navigation. |
| `client/src/features/users/AdminUsersPage.jsx` | Modify | Strip the `<MainLayout>` wrapper and adjust styling for a seamless tab fit. Rename `searchParams.get('tab')` to `searchParams.get('subtab')` and update `switchTab` setter logic to prevent URL collisions. |
| `client/src/features/config/components/ConfigRegistryLoader.jsx` | Modify | Lazy load `AdminUsersPage`, create `UsersSettingsWrapper`, and execute `registerConfigSection` for `users` with `allowedRoles: ['admin']`. |
| `client/src/routes/AppRouter.jsx` | Modify | Replace the `<Route path="/admin/users">` definition with a `<Navigate to="/config?tab=users" replace />`. Update the `<Route path="/doctors">` redirect to point to `/config?tab=users&subtab=doctor`. |

## Interfaces / Contracts

**Configuration Registry Injection**:
```javascript
// client/src/features/config/components/ConfigRegistryLoader.jsx
const AdminUsersSettings = lazy(() => import('../../users').then(m => ({ default: m.AdminUsersPage })));

const UsersSettingsWrapper = ({ controller }) => (
    <AdminUsersSettings />
);

// In loadDefaultConfigSections:
registerConfigSection('users', { 
    title: t('users') || 'Usuarios', 
    icon: 'people', 
    desc: t('users_desc') || 'Gestión de personal médico y administrativo.', 
    allowedRoles: ['admin'] 
}, UsersSettingsWrapper);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Internal Tab Switching | Verify `AdminUsersPage` correctly parses and updates `?subtab=` in the URL without touching `?tab=`. |
| Integration | Registry Loader | Mount `ConfigRegistryLoader` with `admin` role and verify `users` section is emitted; mount with `secretary` role and verify it is omitted. |
| Integration | Route Redirect | Attempt to hit `/admin/users` and ensure the router renders a `Navigate` instruction to `/config?tab=users`. |
| E2E | End-to-End Workflow | Log in as admin, verify "Users" is absent from Navbar. Navigate to "Configuration", click "Users" tab, and toggle between "Secretaries" and "Doctors". |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. (Note: standard internal client-side React routes altered, but no system/backend boundaries crossed).

## Migration / Rollout

No migration required. The legacy `/admin/users` route remains functional as a seamless redirect.

## Open Questions

- [ ] None. The specs sufficiently addressed the proposal questions regarding role scopes (strictly admin).
</Design: Move Users to Config>
