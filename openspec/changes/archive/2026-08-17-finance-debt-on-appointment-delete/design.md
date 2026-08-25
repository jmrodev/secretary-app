# Design: Finance Debt on Appointment/Request Delete

## Technical Approach

Move debt-lifecycle handling out of the event-bus listeners into the service layer, executed with the **same DB `conn`** inside each operation's existing transaction (`deleteAppointment`, `updateStatus`, `deleteRequest`). A new `DebtLifecycleService` centralizes the R1-R7 policy using new `TransactionRepository` helpers. `financeListener.js` is deleted (all 5 branches dead); event **emissions stay** so google-sync/audit listeners keep working. A one-off script (D1) removes unlabeled pending orphans. No schema change — labels are description prefixes.

## Architecture Decisions

| Decision | Options | Tradeoff | Decision |
|---|---|---|---|
| Placement | Listener (own `pool` conn) vs service (`conn`) | Listener is fire-and-forget on another connection → non-atomic, races the uncommitted tx; service shares the tx → atomic, rollback-safe | Service, same `conn` |
| Delete mapping | Status only vs status + `payment_status` | Status alone misses R6 paid-cancel; payment alone misses absent/completed retention | Status-driven + `payment_status === 'paid'` for R6 |
| Labeling | New column vs description prefix | Column = schema change; prefix matches existing `CONCAT(prefix, ': ', desc)` convention (`proc_pay_patient_debt`) | Description prefix, idempotent via `NOT LIKE` guard |
| Orphan cleanup | Accept vs one-off script | Script removes unlabeled pending orphans (D1); label guard protects retained debt | One-off maintenance script |
| Dead listeners | Fix vs remove | MEDICAL_REQUEST_DELETED calls nonexistent `deleteByRequestId` → swallowed TypeError; appointment branches no-op or race | Remove; debt handled in services |

**Delete/status mapping (R1-R6)** — rendered = `completed`|`absent`:

- `completed`, `absent` → retain pending, label `Deuda (Turno Eliminado)` (R2; absent per R4); paid unchanged
- `pending`, `confirmed`, `rescheduled`, `arrived`, `reserved` → delete pending (R3)
- `cancelled` → delete pending (R5); if `payment_status === 'paid'` label paid `Saldo a favor (Turno Eliminado)` (R6)
- `suspended` → legacy behavior preserved: delete pending, null `payment_status`
- Paid delete (no-show) → paid transactions unchanged (income kept)

**Request delete (R7)**: `completed` → retain pending, label `Deuda (Turno Eliminado)`, detach; `pending`/`rejected`/`cancelled` → delete pending; paid unchanged.

**Absent (R4)**: `updateStatus` no longer nulls `payment_status` for `absent` (only `cancelled`/`suspended`); pending kept → automatically counts toward patient debt (`proc_pay_patient_debt` sums all patient pending rows). Not retroactive.

## Data Flow

```
deleteAppointment: findById → medical-records check (throw → no tx change)
  → handleAppointmentDelete(conn, appt)   [captures txs by appointment_id]
  → freeSlot → appointmentRepository.delete → emit(APPOINTMENT_DELETED) → commit
updateStatus: update appt → _handleCancellation → handleAppointmentStatusChange(conn, appt, status)
  → emit(APPOINTMENT_CANCELLED) → commit
deleteRequest: findById → handleRequestDelete(conn, reqInfo)
  → recycleBin → delete medications → requestRepository.delete → commit
```

All mutations share `conn`; any throw → `conn.rollback()` → debt untouched (spec scenarios). `sp_sync_*` triggers fire while source rows exist (harmless); the emits are consumed only by google-sync/audit listeners.

## File Changes

| File | Action | Description |
|---|---|---|
| `server/services/finance/debtLifecycleService.js` | Create | Policy: `handleAppointmentDelete(conn, appt)`, `handleAppointmentStatusChange(conn, appt, status)`, `handleRequestDelete(conn, reqInfo)` |
| `server/repositories/finance/transactionRepository.js` | Modify | Add `findByAppointmentId`, `findByRequestId`, `detachAndLabel(ids, label, conn)`, `deletePendingByAppointmentId`, `deletePendingByRequestId` |
| `server/services/appointments/modificationService.js` | Modify | Call debt service in `deleteAppointment` + `updateStatus`; stop nulling `payment_status` on absent |
| `server/services/medical/MedicalRequestService.js` | Modify | Call debt service in `deleteRequest`; remove `MEDICAL_REQUEST_DELETED` emit |
| `server/listeners/financeListener.js` | Delete | All branches dead (appointment: 0-row/racy; request: nonexistent repo methods) |
| `server/app.js` | Modify | Remove `require('./listeners/financeListener')` |
| `server/events/eventConstants.js` | Modify | Remove `MEDICAL_REQUEST_CREATED/UPDATED/DELETED` (no remaining users) |
| `server/scripts/maintenance/cleanup-orphan-debt.js` | Create | D1 one-off: delete unlabeled pending orphans (`appointment_id`/`request_id`/`rental_id` NULL, description not label-prefixed); prints affected rows |

## Interfaces / Contracts

```js
class DebtLifecycleService {
  async handleAppointmentDelete(conn, appt)              // appt: {id, status, payment_status}
  async handleAppointmentStatusChange(conn, appt, status)
  async handleRequestDelete(conn, reqInfo)               // reqInfo: {id, status}
}
// Labels: `Deuda (Turno Eliminado): ${desc}` | `Saldo a favor (Turno Eliminado): ${desc}`
// detachAndLabel: UPDATE transactions SET appointment_id = NULL, request_id = NULL,
//   description = CONCAT(?, ': ', COALESCE(description,'')) WHERE id IN (?)
//   AND (description IS NULL OR description NOT LIKE CONCAT(?, ':%'))   // idempotent
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `debtLifecycleService` mapping per status/payment | Mock `conn` (pattern: `transactionRepository.test.js`); assert SQL + params; shared-conn only |
| Unit | New `TransactionRepository` methods | Mock conn; assert parametrized SQL, label guard, pending-only deletes |
| Unit | `modificationService.deleteAppointment/updateStatus` | Mock deps; medical-records throw leaves txs untouched; rollback on failure; absent keeps pending + `payment_status` |
| Unit | `MedicalRequestService.deleteRequest` | completed retains+labels; pending/rejected removes; no event emit |
| Unit | Cleanup script | Dry-run SQL filters unlabeled pending orphans; labeled rows preserved |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary (the D1 script is a manually-invoked maintenance script).

## Migration / Rollout

No schema change; rollback = git revert (labels don't affect payment logic). D1 runs once via `node scripts/maintenance/cleanup-orphan-debt.js` after deploy; its label-guard keeps retained debt. Existing `fix_orphans.sql` (dangling `appointment_id`) is subsumed by the script's orphan predicate.

## Open Questions

- [ ] Confirm `suspended` keeps legacy delete-pending behavior (unspecified by R1-R7; preserving current behavior).
- [ ] Confirm cleanup may also drop dangling-`appointment_id` orphans (currently handled by `fix_orphans.sql`) in the same run.