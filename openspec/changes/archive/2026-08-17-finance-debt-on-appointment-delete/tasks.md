# Tasks: Finance Debt on Appointment Delete

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,000–1,300 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Delivery strategy | ask-on-risk |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

> Blockers: confirm `suspended` legacy and D1 scope.

### Suggested Work Units

Runner: `pnpm --filter server test`; `-- <pattern>` focuses.

| Unit | Goal | PR | Pattern | Harness | Rollback |
|------|------|----|---------|---------|----------|
| 1 | Repo helpers + DebtLifecycleService | 1 | transactionRepository debtLifecycleService | Jest, mocked conn | revert src+tests |
| 2 | modificationService wiring | 2 | modificationService | Jest, mocked deps | revert service + test |
| 3 | deleteRequest + listener removal | 3 | (full suite) | Jest, mocked deps | revert + restore listener |
| 4 | D1 cleanup-orphan-debt.js | 4 | cleanup-orphan | manual run | revert script |

## Phase 1: TransactionRepository helpers

- [x] 1.1 RED `transactionRepository.test.js`: `findByAppointmentId`/`findByRequestId` — select by FK on shared conn; assert SQL/params
- [x] 1.2 RED: `detachAndLabel(ids, label, conn)` — null FKs, label-prefix CONCAT, `id IN (?)`, `NOT LIKE` guard
- [x] 1.3 RED: `deletePendingByAppointmentId`/`deletePendingByRequestId` — DELETE `WHERE fk = ? AND status = 'pending'`
- [x] 1.4 GREEN: add 5 methods to `server/repositories/finance/transactionRepository.js` (parametrized, conn-optional)

## Phase 2: DebtLifecycleService

- [x] 2.1 RED `debtLifecycleService.test.js`: `handleAppointmentDelete` — completed/absent → detachAndLabel; non-rendered → deletePending; cancelled → deletePending + 'Saldo a favor…' when paid; suspended → deletePending + null payment_status; paid untouched
- [x] 2.2 RED: `handleAppointmentStatusChange` — absent → retain pending + payment_status; cancelled → deletePending + paid label
- [x] 2.3 RED: `handleRequestDelete` — completed → detachAndLabel; pending/rejected/cancelled → deletePendingByRequestId; paid unchanged
- [x] 2.4 GREEN: create `server/services/finance/debtLifecycleService.js` (3 methods; label prefixes)

## Phase 3: Appointment wiring

- [x] 3.1 RED `modificationService.test.js`: deleteAppointment — completed w/o records retains+labels; records-throw → no debt call, no tx change; failure → rollback; updateStatus — absent keeps pending+payment_status; cancelled removes pending + paid label; suspended legacy
- [x] 3.2 GREEN: `modificationService.js` — inject service; `handleAppointmentDelete(conn, appt)` before `appointmentRepository.delete`; `handleAppointmentStatusChange` in cancel/absent/suspend branch; stop nulling payment_status on absent (L77-79)

## Phase 4: Request wiring + dead listener removal

- [x] 4.1 RED `MedicalRequestService.test.js`: deleteRequest — completed retains+labels+detaches; pending/rejected removes; no emit, no swallowed TypeError
- [x] 4.2 GREEN: `MedicalRequestService.js` — call `handleRequestDelete(conn, reqInfo)`; remove emit + unused EVENTS import
- [x] 4.3 DELETE `server/listeners/financeListener.js`; drop `require` in `server/app.js`; `appointmentListeners.js` stays
- [x] 4.4 `eventConstants.js` — remove `MEDICAL_REQUEST_CREATED/UPDATED/DELETED`; grep 0 users

## Phase 5: D1 orphan cleanup

- [x] 5.1 RED: cleanup test — deletes unlabeled pending orphans (FKs NULL); keeps labeled (D1)
- [x] 5.2 GREEN: create `server/scripts/maintenance/cleanup-orphan-debt.js` — DELETE with label guard, prints rows; covers dangling-`appointment_id` orphans

## Phase 6: Verification

- [x] 6.1 Full suite `pnpm --filter server test` green (20/132 baseline + new)
- [x] 6.2 Confirm APPOINTMENT_DELETED/CANCELLED reach google-sync/audit
- [x] 6.3 Map all 22 spec scenarios to RED tests