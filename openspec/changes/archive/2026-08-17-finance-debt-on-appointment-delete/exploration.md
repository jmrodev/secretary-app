# Exploration: finance-debt-on-appointment-delete

Register a patient debt when an appointment is deleted, so finance keeps the debt instead of losing it.

## Current State

### How finance receives work (three mechanisms coexist)

1. **Event bus `eventBus` (ECC pattern)** — `server/events/eventBus.js` + `eventConstants.js`. Subscribed in `server/listeners/financeListener.js`:
   - `APPOINTMENT_DELETED` — emitted by `ModificationService.deleteAppointment()` (`modificationService.js:32`) **inside the transaction, before commit**, with `conn` in the payload. Listener ignores `conn` and uses `pool`:
     - `payment_status === 'paid'` → renames description to "Saldo a favor (Turno Eliminado)". **Never matches rows** (see FK finding below).
     - otherwise → `DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'`. **Never matches rows** either.
     - then `CALL sp_sync_appointment_payment_status(?)` → no-op (appointment row already deleted).
   - `APPOINTMENT_CANCELLED` — emitted by `updateStatus()` for `cancelled`/`absent`/`suspended` (same file, line 94), also with `conn` ignored. Listener deletes pending transactions by `appointment_id` and re-syncs. **This one works**: the appointment row still exists, transactions are not locked by the service tx, so the DELETE matches and the debt is removed. Note the listener's sync SP can overwrite the `payment_status = null` the service just set (race, cosmetic for cancelled appts).
   - `MEDICAL_REQUEST_CREATED` / `MEDICAL_REQUEST_UPDATED` — subscribed but **never emitted** (only 6 `.emit()` calls exist in the whole server; grep-verified). Dead code. They also call `transactionRepository.updateByRequestId` which **does not exist** (TypeError swallowed by try/catch).
   - `MEDICAL_REQUEST_DELETED` — emitted by `MedicalRequestService.deleteRequest()` with `conn`. Listener calls `transactionRepository.deleteByRequestId` which **does not exist** → TypeError swallowed. The transaction is actually orphaned by the FK `fk_transactions_request ... ON DELETE SET NULL` (request row deleted).
2. **Direct service calls (the real debt-creation mechanism)**: `financeService.createTransaction(data, userId, conn)` with `debt_amount`:
   - `MedicalRequestService.generateRequestDebt()` (create/complete request),
   - `PrescriptionService._handleFinancialsAndReminders()` (prescription, `appointment_id` linked),
   - `LicenseService._handleFinancials()` (license, `appointment_id` linked),
   - `FinanceController.createTransaction()` (REST `POST /finances/transactions`; client `useTransactionForm` computes `debt_amount = price - paid`).
   These pass the same `conn`, so they are **atomic** with the business operation.
3. **DB triggers as a safety net**: `trg_audit_transaction_insert/update/delete` call `sp_sync_appointment_payment_status` / `sp_sync_rental_payment_status` / `sp_sync_request_payment_status` on every transaction change. This is the real payment-status sync; `createTransaction` also calls the sync SPs explicitly.

**Second bus `appointmentEvents`** (`server/events/appointmentEvents.js`): used by `bookingService` (`appointmentCreated`, `appointmentOverwritten`) for WhatsApp confirmation, Google Calendar sync and audit logging. Finance does NOT participate. `appointmentStatusUpdated` is subscribed but never emitted (dead). This bus is domain-specific (appointments), not a finance duplication.

### How debt is represented today

- `transactions.status = 'pending'` = debt. Created through `sp_create_transaction` with `status='pending'` (from `debt_amount` in `createTransaction`; description suffixed "(Pendiente)").
- `appointments.payment_status` ∈ {pending, debt, partial, paid, bonified} — derived by `sp_sync_appointment_payment_status` from aggregated transactions (`v_total_rows`/`v_paid_amount`/`v_pending_amount`/`v_bonified_count`), invoked by triggers and explicitly. `bonified` comes from `sp_mark_as_bonified` (transactions set amount=0, method='bonified', status='paid').
- `medical_requests.payment_status` + `debt_amount` — derived by `sp_sync_request_payment_status` (duplicated in JS as `financeService.syncRequestPaymentStatus`).
- `proc_pay_patient_debt` — FIFO payment of ALL pending transactions of a patient (cursor `transactions JOIN patients ON t.related_user_id = p.user_id ... status='pending'`; **no appointment filter**). Partial payment splits the debt into a new `on_account` pending row; surplus becomes an "Advance Payment / Credit Balance" paid row. Partial splits copy `appointment_id`/`request_id` from the original.
- Listing: `transactionRepository.findFiltered` filter `(t.status != 'pending' OR t.appointment_id IS NULL OR a.status = 'completed')` — **orphaned pending transactions (appointment_id NULL) ARE listed**. `countFiltered` does NOT apply this filter (count ≠ list when live pending appts exist — adjacent bug).

### What actually happens today on delete/cancel

**KEY FINDING — the APPOINTMENT_DELETED listener is effectively dead.** `transactions.appointment_id` has FK `fk_transactions_appointment ... ON DELETE SET NULL` (01-schema.sql:1274, no ALTER drops it anywhere). `deleteAppointment()` deletes the appointment row BEFORE emitting the event; the FK detaches every transaction (paid and pending) from the deleted appointment. The listener's `UPDATE/DELETE ... WHERE appointment_id = ?` then matches **0 rows** (after lock wait it sees the committed `appointment_id = NULL`).

Net result today:
- **Delete with debt → the pending debt SURVIVES as an orphan** (`appointment_id = NULL`), still listed in finance (filter passes) and still payable via `proc_pay_patient_debt`. The "delete removes the debt" intent is NOT what happens.
- **Delete with paid status → the paid income survives** without the "Saldo a favor" rename (that branch never fires). No client code references "Saldo a favor".
- **Cancel/absent/suspended → the debt IS deleted** (appointment row exists, listener DELETE matches) and `absent` also decrements `behavior_rating` (service `_handleCancellation`).
- So the business semantics are **inconsistent**: cancel removes the debt; delete (accidentally) keeps it.

**Atomicity**: listeners ignore the `conn` in the payload and use `pool`, so finance cleanup is NOT atomic with the appointment transaction, and runs concurrently with it (lock waits / races with the service's own `payment_status` writes).

**Adjacent rot found**:
- `updatePaymentStatus` and `updateType` controller endpoints call `modificationService.updatePaymentStatus/updateType` which **don't exist** → always TypeError (routes `PATCH /:id/payment`, `PATCH /:id/type` broken; not used by client).
- `MEDICAL_REQUEST_DELETED` listener always fails; request debt is orphaned by FK on request deletion (same pattern as appointments).
- `deleteAppointment` blocks deletion when prescriptions/licenses exist for the appointment, so the only debt-at-delete case today is the plain consultation debt (no medical records).

## Affected Areas

- `server/services/appointments/modificationService.js` — `deleteAppointment()`: the natural home for debt retention (has `conn`, `appt.payment_status`, `appt.cost`/`paid_amount` before delete).
- `server/listeners/financeListener.js` — dead/broken branches; candidate for deletion or conversion to use `conn`.
- `server/repositories/finance/transactionRepository.js` — may need a `detachDebtByAppointmentId`/label update method; `findFiltered` filter already shows orphaned pending.
- `server/services/finance/financeService.js` — `createTransaction` (debt creation pattern to reuse), `syncRequestPaymentStatus`.
- `server/01-schema.sql` — `sp_sync_appointment_payment_status`, `proc_pay_patient_debt`, FK `fk_transactions_appointment`, triggers.
- `server/services/appointments/bookingService.js` — `handleOverwrite` deletes appointments **without emitting APPOINTMENT_DELETED** (orphans transactions too — same inconsistency).
- `server/services/medical/MedicalRequestService.js` — `deleteRequest` emits the broken MEDICAL_REQUEST_DELETED.
- `server/controllers/appointments/modification.js` — passes `adminPassword`; no change needed unless a UI decision flag is added.
- `client/src/features/appointments/hooks/useAppointmentActions.js` (`handleDelete`), `useAppointments.js` (`deleteAppointment` API call) — only if option (c) is chosen.
- Tests: `server/services/finance/financeService.test.js` (createTransaction/payDebt; unaffected unless logic moves). **No tests exist** for `modificationService` or `financeListener`.

## Approaches

1. **Conserve + label the debt inside the delete transaction (recommended)**
   In `deleteAppointment`, before deleting the appointment (or atomically after, using the same `conn`), convert the appointment's pending transactions into a standalone patient debt: `UPDATE transactions SET appointment_id = NULL, description = CONCAT('Deuda (Turno Eliminado): ', description) WHERE appointment_id = ? AND status = 'pending'`. Optionally rename paid rows to "Saldo a favor (Turno Eliminado)" (the code's original intent, currently dead). This formalizes what the FK already does, but deliberately and labeled.
   - Pros: minimal code, no schema change; consistent with `findFiltered` (orphan pending shown), `proc_pay_patient_debt` (no appointment filter), triggers (no-op, appointment gone); atomic via `conn`; matches the user's ask ("registrar la deuda").
   - Cons: existing orphaned rows from past behavior remain unlabeled (needs one-off migration or acceptance); does not change the cancel path (business decision).
   - Effort: **Low-Medium** (service + listener cleanup + tests).

2. **Create a brand-new debt transaction on delete**
   Delete the pending rows and INSERT a fresh pending transaction (`type income_patient`, `amount 0`, `debt_amount`, `description "Deuda (Turno Eliminado)"`, `related_user_id = patient user`, `appointment_id NULL`).
   - Pros: single clean transaction, full control of description/type; reuses `createTransaction` pattern.
   - Cons: does a delete+insert where option 1 does an update; needs patient user id + cost resolution (the appointment row is about to vanish — must read before delete); more moving parts, more test surface; no benefit over option 1.
   - Effort: **Medium**.

3. **UI decision modal ("¿Registrar la deuda?")**
   Add a confirmation choice in `useAppointmentActions.handleDelete`, send a flag in `DELETE /appointments/:id` body → controller → `deleteAppointment`.
   - Pros: explicit business control per deletion; also enables choosing "cancel-like" behavior (drop debt) vs "keep debt".
   - Cons: touches client + i18n + routes + controller + service; the delete flow already has a confirm + admin password gate; larger blast radius (multiple delete entry points: `useAppointmentsHandlers`, `useDashboardController`); over-engineering unless business wants the choice.
   - Effort: **Medium-High**.

4. **Minimal communication reorg (do alongside 1)**
   Move the finance cleanup into the services (pattern already used by `generateRequestDebt`), using `conn` for atomicity; delete dead listeners (`MEDICAL_REQUEST_CREATED`, `MEDICAL_REQUEST_UPDATED`); remove or fix `MEDICAL_REQUEST_DELETED` (or align request debt policy with appointments). Keep `eventBus` for cross-domain notifications (google sync) as-is. Full bus redesign NOT needed for this change.
   - Pros: kills the double-mechanism perception where it hurts (non-atomic listener); less code; testable in Jest.
   - Cons: touches several files; must keep google sync listener intact.
   - Effort: **Low-Medium**.

## Recommendation

**Option 1 + option 4**: deliberately retain and label the pending debt ("Deuda (Turno Eliminado)") inside `deleteAppointment`'s transaction using `conn`, optionally applying the "Saldo a favor" rename to paid rows, and remove the dead/broken finance listener code. This matches what the FK already does in practice, makes it deterministic and atomic, and is testable. Do NOT build the UI modal unless the business explicitly wants a per-delete choice.

**Business decisions to raise with the user before proposal:**
1. Cancel/absent currently DELETE the debt; delete currently (accidentally) KEEPS it. Should cancel also keep the debt (consistency), or is drop-on-cancel the intended policy?
2. Deleting a PAID appointment: keep the income as-is, or rename as credit "Saldo a favor (Turno Eliminado)" (the code's original, never-working intent)?
3. Same policy for medical-request debts (deleted requests orphan their debt today)? In scope now or later?
4. Accept existing unlabeled orphaned debt rows, or run a one-off labeling migration?

## Risks

- Changing delete semantics affects accounting history: rows created before this change are orphans without label; a migration may be needed.
- The cancel-vs-delete inconsistency is a business-policy question; implementing one side without confirmation risks wrong behavior.
- `proc_pay_patient_debt` pays ANY pending patient debt FIFO; labeled deleted-turno debts will be paid normally (probably desired, but confirm display in patient detail/finance list).
- Listener removal must keep the google-sync `APPOINTMENT_DELETED` listener untouched (it works and is separate).
- `countFiltered` ≠ `findFiltered` counts (adjacent bug) may confuse acceptance checks.
- No existing tests for `modificationService`/`financeListener`; strict TDD requires writing them first (integration-style with mocked `conn`).

## Ready for Proposal

Yes — exploration complete. Tell the user: today the debt on a deleted appointment is ALREADY kept (accidentally, via FK ON DELETE SET NULL, as an unlabeled orphan), while cancel deletes it; the change formalizes the delete case as an intentional, labeled, atomic debt retention, and the key open question is the cancel-vs-delete policy.