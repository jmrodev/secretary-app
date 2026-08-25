# Proposal: Admin Role Boundary Refinement

## Intent
Align the application's role boundaries with clear domain separation of concerns:
- **`admin`**: Technical & System Administrator (User accounts, Audit logs, System Configuration / Modules / Integrations / AFIP).
- **`secretary` / `doctor`**: Clinical Operators (Clinical dashboard, Appointments, Medical records, Institutions, Holidays/Work calendar, Finances).

## Problem Statement
Currently:
1. `admin` has access to `/dashboard` (clinical turnos, daily appointments, cash monitor), which is meaningless for a technical system administrator.
2. `admin` has access to `/institutions` (institutional debtor management & patient convenios) and `/holidays` (doctor agenda working calendar), which are secretary operations.
3. When `admin` logs in or hits the root `/` route, they are routed to `/dashboard` instead of `/admin/users`.

## Proposed Solution
1. **Navbar Navigation**:
   - Hide `/dashboard` for `admin` (`show: !isAdmin`).
   - Restrict `/institutions` and `/holidays` to `isSecretary` (`show: isSecretary`).
   - Keep `/admin/users`, `/logs`, and `/config` accessible to `admin`.
2. **Routing & Guards (`AppRouter.jsx` & `RoleGuard.jsx`)**:
   - Restrict `/dashboard` to `doctor` and `secretary`.
   - Restrict `/institutions` and `/holidays` to `secretary`.
   - Update default landing/fallback route for `admin` from `/dashboard` to `/admin/users`.
3. **Automated Tests**:
   - Verify all role guard and navbar tests pass.
