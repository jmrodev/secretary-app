# Proposal: Reschedule Appointment Flow and Validation

## Intent
Provide a reliable appointment rescheduling mechanism across backend and frontend: prevent slot collisions (double bookings), synchronize updates with Google Calendar, standardize API response contracts, handle administrative authorization challenges gracefully, and properly close rescheduling UI mode.

## Problem Statement
1. **Slot Collision**: `modificationService.updateAppointment` updates `appointment_date` without checking if the target slot is already occupied, allowing duplicate bookings.
2. **Calendar Drift**: Rescheduling does not update Google Calendar events when `google_event_id` is present.
3. **Response Discrepancy**: Controller returns `{ message: "Appointment updated" }` lacking `{ success: true }`, causing client-side success verification ambiguity.
4. **Hook Incompleteness**:
   - `useAppointments.rescheduleAppointment` returns raw `res.data`.
   - `useAppointmentActions.handleReschedule` does not check `result.success`, does not trigger `fetchAppointments()` or `showMessage(t('rescheduled_success'), 'success')`, and ignores `AUTH_REQUIRED` 403 errors.
   - `useAppointmentsHandlers.handleAdminAuthConfirm` is an unmapped stub, leaving the admin auth retry flow broken.

## Proposed Changes
1. **Backend**:
   - In `modificationService.updateAppointment`: verify target slot availability via `appointmentRepository.findBySlot`; throw `ConflictError` if occupied.
   - Trigger `googleSyncService.syncUpdate` when `appt.google_event_id` is present.
   - In `modification.js`: return `{ success: true, message: "Appointment updated" }`.
2. **Frontend**:
   - In `useAppointments.js`: return `{ success: true, ...res.data }`.
   - In `useAppointmentActions.js`: accept `adminPassword`, trigger notifications on success, return `{ type: 'AUTH_REQUIRED' }` on 403.
   - In `useAppointmentsHandlers.js`: call `exitRescheduleMode()` on success; implement `handleAdminAuthConfirm` to execute retries with password.
3. **Automated Testing**:
   - Jest tests in `modificationService.test.js` (success, collision, permissions).
   - Vitest tests for appointment hooks (success, auth error, retry flow).

## Rollback Plan
Revert frontend and server commits. No database migrations or schema alterations are introduced.
