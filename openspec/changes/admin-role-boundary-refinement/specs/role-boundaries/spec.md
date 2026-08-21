# Spec: Role Boundaries & Navigation Alignment

## Requirements

### Requirement 1: Admin Navigation Restrictions
- `Navbar` MUST NOT render the following items when `user.role === 'admin'`:
  - `/dashboard`
  - `/institutions`
  - `/holidays`
  - `/appointments`
  - `/patients`
  - `/rentals`
  - `/documents`
  - `/finances`
  - `/insurances`
- `Navbar` MUST render for `user.role === 'admin'`:
  - `/admin/users` (Users management)
  - `/logs` (Audit logs)
  - `/config?tab=modules` (System configuration)
- The brand logo in `Navbar` MUST link to `/admin/users` when `user.role === 'admin'`, and `/dashboard` for clinical roles.

### Requirement 2: Route Protection and Fallbacks
- `AppRouter` MUST protect `/dashboard` with `RoleGuard` allowing only `['secretary', 'doctor']`.
- `AppRouter` MUST protect `/institutions` with `RoleGuard` allowing only `['secretary']`.
- `AppRouter` MUST protect `/holidays` with `RoleGuard` allowing only `['secretary']`.
- `RoleGuard` fallback redirection MUST route `admin` users to `/admin/users` rather than defaulting to `/dashboard`.
- If an admin visits `/`, they MUST be redirected to `/admin/users`.
