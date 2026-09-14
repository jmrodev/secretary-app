# Tasks: Reschedule Appointment Flow and Validation

## Phase 1: Server Backend & Validation (TDD)

- [x] 1.1 Add unit tests for appointment rescheduling, slot collision, and Google sync (RED) (`server/services/appointments/modificationService.test.js`)
  - Test slot collision: when `appointmentRepository.findBySlot` detects an active appointment (`id !== appt.id && status !== 'cancelled'`), `updateAppointment` throws `ConflictError` (Mitigates Threat: Double Booking Race Condition).
  - Test slot collision bypass: verify rescheduling succeeds when `findBySlot` only returns the current appointment (`id === appt.id`) or cancelled records (`status === 'cancelled'`).
  - Test admin permission enforcement: verify `helper.checkModificationPermissions` rejects unauthorized date modifications on protected/past appointments with `AuthRequiredError` (Mitigates Threat: Unauthorized Date Override).
  - Test successful rescheduling: verify `helper.freeSlot` frees former slot, `helper.occupySlot` reserves new slot, appointment record is updated with `status = 'rescheduled'` and `rescheduled_from_date`, and `googleSyncService.syncUpdate` is invoked when `appt.google_event_id` is present (Mitigates Threat: Google Calendar Drift).
  - Test Google sync omission: verify `googleSyncService.syncUpdate` is bypassed when `appt.google_event_id` is null or undefined.

- [x] 1.2 Add controller unit tests for response contract and error mapping (RED) (`server/controllers/__tests__/modificationController.test.js`)
  - Test HTTP 200 response contains `{ success: true, message: "Appointment updated" }` upon successful rescheduling.
  - Test HTTP 409 Conflict status with `{ error: ..., type: 'GENERIC_ERROR' }` when service throws `ConflictError`.
  - Test HTTP 403 Forbidden status with `{ error: ..., type: 'AUTH_REQUIRED' }` when service throws `AuthRequiredError`.

- [x] 1.3 Implement transactional slot collision check and Google sync in `ModificationService` (GREEN) (`server/services/appointments/modificationService.js`)
  - Import `ConflictError` from `../../utils/core/errors`.
  - In `updateAppointment`, when `updates.appointment_date` differs from `appt.appointment_date`:
    - Query existing slots via `await appointmentRepository.findBySlot(appt.doctor_id, newDate, conn)`.
    - Check if any non-cancelled slot exists (`s.id !== appt.id && s.status !== 'cancelled'`); throw `ConflictError("Ya existe un turno confirmado en este horario.")` if occupied.
    - Free former slot via `helper.freeSlot(conn, appt.doctor_id, appt.appointment_date)`.
    - Occupy target slot via `helper.occupySlot(conn, appt.doctor_id, newDate)`.
    - Set `updates.status = 'rescheduled'` and `updates.rescheduled_from_date = appt.appointment_date`.
    - If `appt.google_event_id` is present, call `googleSyncService.syncUpdate(id, appt.doctor_id, appt.google_event_id, { appointment_date: updates.appointment_date, status: updates.status || appt.status }, userId)`.

- [x] 1.4 Standardize update response contract in `ModificationController` (GREEN) (`server/controllers/appointments/modification.js`)
  - Update `exports.updateAppointment` response body from `{ message: "Appointment updated" }` to `{ success: true, message: "Appointment updated" }`.

---

## Phase 2: Frontend Data Hook & Action Pipeline (TDD)

- [x] 2.1 Add unit tests for `useAppointments.rescheduleAppointment` contract normalization (RED) (`client/src/features/appointments/hooks/__tests__/useAppointments.test.js`)
  - Verify `rescheduleAppointment(id, newDate, adminPassword)` sends `PUT /appointments/:id` with `{ appointment_date: isoDate, adminPassword }`.
  - Verify returned object normalizes backend response to `{ success: true, ...res.data }`.
  - Verify `isSubmitting` loading state transitions during the request.

- [x] 2.2 Add unit tests for `useAppointmentActions.handleReschedule` lifecycle and auth challenge (RED) (`client/src/features/appointments/hooks/__tests__/useAppointmentActions.test.js`)
  - Test success path: verify `rescheduleAppointment` is called with `adminPassword`, calls `showMessage(t('rescheduled_success'), 'success')`, triggers `fetchAppointments()`, and returns `{ success: true, ... }`.
  - Test 403 / `AUTH_REQUIRED` challenge: when API responds with HTTP 403 or `type: 'AUTH_REQUIRED'`, verify `handleReschedule` returns `{ type: 'AUTH_REQUIRED' }` and suppresses generic error toast (Mitigates Threat: Unauthorized Date Override).
  - Test generic error: when API rejects with other errors (e.g., HTTP 409 collision), verify `showMessage(t('reschedule_error'), 'error')` is shown and returns `{ success: false }`.

- [x] 2.3 Normalize return contract in `useAppointments.rescheduleAppointment` (GREEN) (`client/src/features/appointments/hooks/useAppointments.js`)
  - Update `rescheduleAppointment` to return `{ success: true, ...res.data }` upon API response resolution.

- [x] 2.4 Implement admin authorization handling and feedback in `useAppointmentActions` (GREEN) (`client/src/features/appointments/hooks/useAppointmentActions.js`)
  - Update `handleReschedule` signature to accept `(apptId, newDateTime, adminPassword = null)`.
  - Forward `adminPassword` into `rescheduleAppointment(apptId, newDateTime, adminPassword)`.
  - Verify `result?.success`: call `showMessage(t('rescheduled_success'), 'success')` and `fetchAppointments()`.
  - Catch block: check for `err.response?.data?.type === 'AUTH_REQUIRED'` or `err.response?.status === 403`, returning `{ type: 'AUTH_REQUIRED' }`.
  - On standard errors, display `showMessage(err.response?.data?.error || t('reschedule_error'), 'error')` and return `{ success: false }`.

---

## Phase 3: Reschedule UI Orchestration & Admin Auth Retry Queue (TDD)

- [x] 3.1 Add integration unit tests for `useAppointmentsHandlers` reschedule mode and retry queue (RED) (`client/src/features/appointments/hooks/__tests__/useAppointmentsHandlers.test.js`)
  - Test `handleSlotClick` in reschedule mode:
    - On confirmed slot selection and successful reschedule: verify `appointmentActions.handleReschedule` is invoked and `exitRescheduleMode()` is called.
    - On `{ type: 'AUTH_REQUIRED' }`: verify `setRetryAction({ type: 'reschedule', args: [rescheduleAppt.id, localISOTime] })` is dispatched and `setAuthModalOpen(true)` is activated.
  - Test `handleAdminAuthConfirm` retry execution:
    - For `retryAction = { type: 'reschedule', args: [id, newDate] }`: verify `handleReschedule(id, newDate, password)` is called with the supplied password.
    - On retry success: verify `setAuthModalOpen(false)`, `setRetryAction(null)`, and `exitRescheduleMode()` are called.
    - For `retryAction = { type: 'delete', args: [id, status] }`: verify `handleDelete(id, status, password)` is invoked and modals are cleared.

- [x] 3.2 Implement `exitRescheduleMode` cleanup and `handleAdminAuthConfirm` retry queue in `useAppointmentsHandlers` (GREEN) (`client/src/features/appointments/hooks/useAppointmentsHandlers.js`)
  - Ensure `handleSlotClick` invokes `exitRescheduleMode()` when `appointmentActions.handleReschedule` returns `result?.success === true`.
  - Implement `handleAdminAuthConfirm(retryAction, password)`:
    - If `retryAction.type === 'reschedule'`: execute `appointmentActions.handleReschedule(id, newDate, password)`. On success, call `setAuthModalOpen(false)`, `setRetryAction(null)`, and `exitRescheduleMode()`.
    - If `retryAction.type === 'delete'`: execute `handleDelete(id, status, password)`. On success, call `setAuthModalOpen(false)` and `setRetryAction(null)`.
  - Export `handleAdminAuthConfirm` directly in the returned memoized handlers object.

---

## Phase 4: Full System Verification & Regression Testing

- [x] 4.1 Run server test suite (`pnpm --filter server test`)
  - Validate all backend unit and integration test suites pass, including `modificationService.test.js` and `modificationController.test.js`.

- [x] 4.2 Run client test suite (`pnpm --filter client test`)
  - Validate all Vitest test suites pass, including `useAppointments.test.js`, `useAppointmentActions.test.js`, and `useAppointmentsHandlers.test.js`.

- [x] 4.3 Run full repository linters and build checks (`pnpm lint`, `pnpm build`)
  - Verify zero ESLint, Stylelint, Oxlint, or React Doctor errors across client and server.
  - Verify production client build succeeds with Vite.
