# Tasks: Admin Role Boundary Refinement

- [ ] 1. Update `RoleGuard.jsx` to dynamically fallback to `/admin/users` for admin users.
- [ ] 2. Update `Navbar.jsx` to hide `/dashboard`, `/institutions`, `/holidays` for `admin`, and link brand logo to `/admin/users` for `admin`.
- [ ] 3. Update `AppRouter.jsx` to guard `/dashboard`, `/institutions`, and `/holidays` with appropriate `RoleGuard` rules.
- [ ] 4. Check and update login redirection in `LoginPage` / `useLoginController` if applicable.
- [ ] 5. Run full test suite (`vitest` client + `jest` server) and `lint` to ensure 100% compliance.
