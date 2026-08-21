# Technical Design: Admin Role Boundary Refinement

## Context
Antigravity architecture and domain model separate clinical operations from system administration.

## Architectural Changes

### 1. `Navbar.jsx`
- Logo Link:
  ```javascript
  const homePath = isAdmin ? '/admin/users' : '/dashboard';
  ```
- `navLinks` list:
  ```javascript
  { path: '/dashboard', label: t('dashboard'), show: !isAdmin },
  { path: '/appointments', label: t('appointments'), show: !isAdmin },
  { path: '/patients', label: t('patients'), show: !isPatient && !isAdmin },
  { path: '/insurances', label: t('insurances'), show: isSecretary },
  { path: '/rentals', label: t('office_rentals'), show: settings?.enable_office_rentals === 'true' && !isAdmin },
  { path: '/documents', label: t('medical_documents'), show: !isAdmin },
  { path: '/finances', label: t('finances'), show: isSecretary },
  { path: '/institutions', label: t('institutions'), show: isSecretary },
  { path: '/holidays', label: t('holidays'), show: isSecretary },
  { path: '/admin/users', label: t('users'), show: isAdmin || canManageUsers },
  { path: '/logs', label: t('audit_logs'), show: isAdmin },
  { path: '/config?tab=modules', label: t('system_config'), show: isStaff }
  ```

### 2. `RoleGuard.jsx`
- Default fallback resolution:
  ```javascript
  const defaultFallback = user?.role === 'admin' ? '/admin/users' : '/dashboard';
  const effectiveFallback = fallbackPath === '/dashboard' ? defaultFallback : fallbackPath;
  ```

### 3. `AppRouter.jsx`
- Wrap `/dashboard` with:
  ```jsx
  <Route path="/dashboard" element={
      <RoleGuard allowedRoles={['secretary', 'doctor']}>
          <DashboardPage />
      </RoleGuard>
  } />
  ```
- Wrap `/institutions` with:
  ```jsx
  <Route path="/institutions" element={
      <RoleGuard allowedRoles={['secretary']}>
          <InstitutionsPage />
      </RoleGuard>
  } />
  ```
- Update `/holidays` to:
  ```jsx
  <Route path="/holidays" element={
      <RoleGuard allowedRoles={['secretary']}>
          <HolidaysPage />
      </RoleGuard>
  } />
  ```

### 4. Auth Redirection on Login
- When logging in, if `user.role === 'admin'`, navigate to `/admin/users`.
