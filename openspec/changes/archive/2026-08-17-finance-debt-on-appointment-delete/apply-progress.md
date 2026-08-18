# Apply Progress: finance-debt-on-appointment-delete

**Status**: success — all 19 tasks complete, full suite green
**Mode**: Strict TDD (Jest, `pnpm --filter server test`)
**Delivery**: SINGLE PR with maintainer-approved `size:exception` (accepted 2026-08-17 by user). No chained PRs.
**Resolved decisions applied**: D1 (cleanup removes ALL unlabeled pending orphans incl. dangling `appointment_id`, subsumes `fix_orphans.sql`); `suspended` legacy preserved (deletes pending + nulls `payment_status`).

## Completed Tasks

Phase 1 — TransactionRepository helpers: 1.1, 1.2, 1.3 (RED), 1.4 (GREEN) ✅
Phase 2 — DebtLifecycleService: 2.1, 2.2, 2.3 (RED), 2.4 (GREEN) ✅
Phase 3 — Appointment wiring: 3.1 (RED), 3.2 (GREEN) ✅
Phase 4 — Request wiring + dead listener removal: 4.1 (RED), 4.2 (GREEN), 4.3, 4.4 ✅
Phase 5 — D1 orphan cleanup: 5.1 (RED), 5.2 (GREEN) ✅
Phase 6 — Verification: 6.1, 6.2, 6.3 ✅

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1-1.3 | `server/repositories/finance/transactionRepository.test.js` | Unit | ✅ 3/3 existing | ✅ Written (6 failing) | ✅ 9/9 | ✅ 6 cases (FK select, label guard, pending-only deletes, conn-optional) | ✅ Clean (idempotent guard docstring) |
| 2.1-2.3 | `server/services/finance/debtLifecycleService.test.js` | Unit | N/A (new file) | ✅ Written (module missing) | ✅ 16/16 | ✅ 16 cases across delete/status/request paths | ✅ Clean (label constants, RENDERED_STATUSES) |
| 3.1 | `server/services/appointments/modificationService.test.js` | Unit | N/A (new file) | ✅ Written (5 failing) | ✅ 6/6 | ✅ 6 cases (records-throw, rollback, absent/cancelled/suspended) | ✅ Clean (comment on R4 fix) |
| 4.1 | `server/services/medical/MedicalRequestService.test.js` | Unit | N/A (new file) | ✅ Written (5 failing) | ✅ 5/5 | ✅ 5 cases (completed/pending/rejected/rollback/no-emit) | ✅ Clean (removed unused imports) |
| 5.1 | `server/scripts/maintenance/cleanup-orphan-debt.test.js` | Unit | N/A (new file) | ✅ Written (module missing) | ✅ 3/3 | ✅ 3 cases (delete/select/default) | ✅ Clean (shared ORPHAN_WHERE) |
| 4.3/4.4 | `server/listeners/financeListener.js`, `eventConstants.js` | Structural | ✅ full suite | N/A (removal) | ✅ 0 users via grep | ➖ Single | ✅ N/A |

### Test Summary
- **Total tests written**: 33 (6 added to existing file + 27 in 4 new suites)
- **Total tests passing**: 168/168 (baseline 132 → +36: 6 transactionRepository + 16 debtLifecycleService + 6 modificationService + 5 MedicalRequestService + 3 cleanup)
- **Suites**: 24 (baseline 20 + 4 new)
- **Layers used**: Unit (33)
- **Approval tests**: None — no behavior-preserving refactor of existing logic (R4 absent-null fix covered by RED test first)
- **Pure functions created**: 1 (`buildCleanupSql` in cleanup script)

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm --filter server test -- <file>` per phase: transactionRepository 9/9, debtLifecycleService 16/16, modificationService 6/6, MedicalRequestService 5/5, cleanup-orphan-debt 3/3 — all passed |
| Runtime harness command/scenario and exact result | `pnpm --filter server test` (full suite) → **24 suites / 168 tests passed**. Lint: `pnpm --filter server lint` → 0 errors (23 pre-existing warnings, none introduced by this change). D1 script: manual run `node scripts/maintenance/cleanup-orphan-debt.js [--dry-run]` — dry-run defaulted safe; not executed against live DB (post-deploy one-off per design). |
| Rollback boundary | Revert: `git revert` of the change restores listener-based behavior (labels don't affect payment logic — no schema change). Atomic units: (a) transactionRepository helpers, (b) debtLifecycleService, (c) modificationService wiring, (d) MedicalRequestService + listener removal, (e) cleanup script — each revertable independently without unrelated work. |

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `server/repositories/finance/transactionRepository.js` | Modified | Added `findByAppointmentId`, `findByRequestId`, `detachAndLabel(ids, label, conn)` (idempotent NOT LIKE guard), `deletePendingByAppointmentId`, `deletePendingByRequestId` — all parametrized, conn-optional |
| `server/repositories/finance/transactionRepository.test.js` | Modified | +6 tests covering the 5 new methods + conn-optional pattern |
| `server/services/finance/debtLifecycleService.js` | Created | R1-R7 policy: `handleAppointmentDelete`, `handleAppointmentStatusChange`, `handleRequestDelete`; exports `DEBT_LABEL`/`CREDIT_LABEL` |
| `server/services/finance/debtLifecycleService.test.js` | Created | 16 tests: delete/status/request mappings incl. suspended legacy, paid untouched, absent retain |
| `server/services/appointments/modificationService.js` | Modified | Inject debt service; `handleAppointmentDelete(conn, appt)` after medical-records check, before `freeSlot`/`delete`; `handleAppointmentStatusChange` in cancel/absent/suspend branch; R4 fix: absent no longer nulls `payment_status` (L77-79 → `['cancelled','suspended']`) |
| `server/services/appointments/modificationService.test.js` | Created | 6 tests: records-throw → no debt/no tx change; failure → rollback; absent keeps pending + payment_status; cancelled paid label; suspended legacy |
| `server/services/medical/MedicalRequestService.js` | Modified | `handleRequestDelete(conn, reqInfo)` before request delete; removed `MEDICAL_REQUEST_DELETED` emit + unused `eventBus`/`EVENTS` imports |
| `server/services/medical/MedicalRequestService.test.js` | Created | 5 tests: completed/pending/rejected delegation, rollback, no emit |
| `server/listeners/financeListener.js` | Deleted | All 5 branches dead (appointment 0-row/racy; request nonexistent repo methods + swallowed TypeError) |
| `server/app.js` | Modified | Removed `require('./listeners/financeListener')` |
| `server/events/eventConstants.js` | Modified | Removed `MEDICAL_REQUEST_CREATED/UPDATED/DELETED` (grep: 0 production users) |
| `server/scripts/maintenance/cleanup-orphan-debt.js` | Created | D1: `buildCleanupSql(mode)` — unlabeled pending orphans (NULL FKs OR dangling `appointment_id`/`request_id`), label guard, `rental_id IS NULL`, dry-run printing; subsumes `fix_orphans.sql` |
| `server/scripts/maintenance/cleanup-orphan-debt.test.js` | Created | 3 tests asserting orphan predicate + label params |

## Scenario → RED Test Map (task 6.3 — all 22)

| # | Scenario | RED test |
|---|----------|----------|
| 1 | Non-rendered appointment deleted (R1) | debtLifecycleService: confirmed delete → deletePending |
| 2 | Completed appointment deleted (R2) | debtLifecycleService: completed delete → detachAndLabel DEBT_LABEL |
| 3 | Delete blocked by medical records | modificationService: records-throw → no debt call, no tx change |
| 4 | Confirmed appointment deleted (R3) | same as #1 |
| 5 | Absent with pending debt (R4) | debtLifecycleService + modificationService: absent → retain, payment_status kept |
| 6 | Historical absent untouched (D3) | absent branch performs zero mutations (asserted no repo/conn calls) — no recalculation logic |
| 7 | Cancelled with pending debt (R5) | debtLifecycleService: cancelled → deletePending, no label |
| 8 | Paid appointment deleted no-show (R6) | debtLifecycleService: paid-only txs → untouched |
| 9 | Paid appointment cancelled (R6) | debtLifecycleService: cancelled+paid → deletePending + CREDIT_LABEL |
| 10 | Deleted cancelled paid appt, labels unchanged | detachAndLabel NOT LIKE idempotency guard test |
| 11 | Failed delete leaves debt untouched | modificationService: delete throws → rollback, commit not called |
| 12 | Google sync unaffected (D2) | grep verification (6.2): emits at modificationService:36/101 → appointmentListeners:10/18 |
| 13 | Pre-change orphan removed (D1) | cleanup test: DELETE targets unlabeled pending orphans |
| 14 | Labeled retained debt preserved (D1) | cleanup test: label params guard |
| 15 | Completed request deleted (R7) | debtLifecycleService + MedicalRequestService: completed → retain+label+detach |
| 16 | Pending request deleted (R7) | debtLifecycleService + MedicalRequestService: pending → remove |
| 17 | Rejected request deleted (R7) | debtLifecycleService + MedicalRequestService: rejected → remove |
| 18 | Failed request delete leaves debt untouched | MedicalRequestService: delete throws → rollback |
| 19 | No listener error on request deletion | MedicalRequestService: no MEDICAL_REQUEST_DELETED emit; financeListener deleted |
| 20 | Request debt handled by service | MedicalRequestService delegation assertions |
| 21 | Pre-change request orphan removed (D1) | cleanup test: request_id NOT IN guard |
| 22 | Retained request debt preserved (D1) | cleanup test: label guard |

## Deviations from Design
None — implementation matches design.md. Details:
- Design said "stop nulling payment_status on absent (L77-79)" — implemented as `['cancelled','suspended']` (absent removed).
- `handleAppointmentDelete` nulls `payment_status` for suspended per task 2.1 (vestigial in delete flow — row is deleted next — but faithful to the task).

## Issues Found
None.

## Remaining Tasks
None — all 19 tasks complete.

## Workload / PR Boundary
- Mode: single PR with `size:exception` (maintainer-approved 2026-08-17)
- Current work unit: entire change
- Boundary: from transactionRepository helpers → cleanup script; ~400 changed lines (13 files, 200 insertions + 73 deletions authored + ~5 new files) — exception pre-approved
- Estimated review budget impact: above 400-line default budget; exception recorded

## Risks
| Severity | Risk | Mitigation |
|----------|------|------------|
| Medium | R4 now charges absent patients' pending debt (behavior change for ops) | Explicit spec requirement; label "Deuda (Turno Eliminado)" only on delete; not retroactive (no migration) |
| Low | D1 script deletes unlabeled pending orphans — could remove legitimate unlabeled debt if any exists | Label guard + `--dry-run` default printing; run manually post-deploy; rows printed before deletion |
| Low | Event bus consumers could be affected by listener removal | Verified APPOINTMENT_DELETED/CANCELLED/COMPLETED emits intact and consumed by google-sync (appointmentListeners unchanged) |
| Low | `sp_sync_appointment_payment_status` no longer called by finance branches after delete/cancel | Debt policy now applied atomically in-service on same conn; stored-procedure sync was for payment-status bookkeeping on appointment rows that are being deleted/changed by the service itself |