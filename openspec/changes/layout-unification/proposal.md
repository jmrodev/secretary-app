# Proposal: Layout Unification

## Intent

All authenticated pages already import `MainLayout`, but prop usage is inconsistent — 
some pages omit `wide`/`flush`, some have no `title`, and many nest redundant 
`dashboard-layout__main`/`*-page-orchestrator__main` containers inside `MainLayout.inner`.
This creates visual inconsistency across pages (spacing, max-width behavior) 
and maintenance friction when changing the global layout token.

**Business problem**: Users notice that boxes and spacing feel different across pages 
despite being the same app. Developers must remember per-page layout hacks instead 
of trusting the template.

## Scope

### In Scope
- Standardize `MainLayout` prop usage across all 16 authenticated pages to `wide flush`
- Remove redundant inner `<main>` / `<div>` containers whose only role is layout (not semantic/feature)
- Ensure `title` prop is set on all pages that have a meaningful page name
- Add `title` i18n keys for the 3 pages missing it (Chat, Requests, Patients)
- `OutreachPage`: add `wide flush` (currently uses no props)
- `AuditLogsPage` / `ReportsPage`: add `flush` (currently only `wide`)
- `AdminUsersPage`: add `wide flush` (currently no props)

### Out of Scope
- Redesigning `MainLayout` API or CSS tokens (those are stable after today's `max-width: 1200px` change)
- Touching public pages (`LoginPage`, `RegisterPage`, `TempAccessPage`, `PublicRequestPage`, `PublicRegisterPage`) — these intentionally have no Navbar
- Changing any visual appearance beyond layout prop standardization
- CSS refactor of feature-specific organisms (toolbar, sidebar components) — those are internal layout, not the template concern

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `main-layout`: Standardized prop contract — every authenticated page uses `wide flush title={...}`

## Approach

**Pure prop-normalization refactor.** No new components, no CSS changes.

For each of the 5 inconsistent pages:
1. Add missing `wide` and/or `flush` props to `<MainLayout>`
2. Add `title` prop where missing (using existing `t()` keys or adding new ones)
3. Remove any intermediate `<main className="*-page-orchestrator__main">` or 
   `<div className="dashboard-layout__main">` that only wrap `MainLayout.inner` content 
   without adding feature semantics

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `features/outreach/pages/OutreachPage.jsx` | Modified | Add `wide flush title` |
| `features/reports/AuditLogsPage.jsx` | Modified | Add `flush title` |
| `features/reports/ReportsPage.jsx` | Modified | Add `flush` |
| `features/users/AdminUsersPage.jsx` | Modified | Add `wide flush` (already has `title`) |
| `features/appointments/AppointmentsPage.jsx` | Verify | Confirm props and inner main |
| `features/dashboard/DashboardPage.jsx` | Modified | Remove redundant inner `<main>` |
| `features/finances/FinancesPage.jsx` | Audit | Remove `dashboard-layout__main` wrapper |
| `features/patients/PatientsPage.jsx` | Modified | Remove redundant `<main>` inside layout |
| `features/institutions/InstitutionsPage.jsx` | Audit | Remove `dashboard-layout__main` wrapper |
| `features/medical_documents/RequestsPage.jsx` | Audit | Remove `dashboard-layout__main` wrapper |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `flush` on AuditLogs/Reports breaks internal scroll | Low | Audit CSS of those pages before applying |
| Removing inner `<main>` breaks flex/grid layout | Low | Only remove if the `<main>` has no layout-defining CSS of its own |
| Missing i18n key for new `title` props | Low | Reuse existing keys or add under existing namespaces |

## Rollback Plan

All changes are in `.jsx` files with no DB or API impact. `git revert` of the PR is clean.
Vite HMR makes verification instant in dev.

## Dependencies

- None — `MainLayout` API is already stable.

## Success Criteria

- [ ] All 16 authenticated pages use `<MainLayout wide flush title={...}>` (or intentional exception documented in code comment)
- [ ] Zero `dashboard-layout__main` class usage inside page-level JSX (moved or removed)
- [ ] Visual diff: spacing and max-width consistent across Dashboard, Patients, Finances, Reports, Outreach
- [ ] No regressions in Appointments calendar layout (full-width critical)
- [ ] `pnpm lint` passes
