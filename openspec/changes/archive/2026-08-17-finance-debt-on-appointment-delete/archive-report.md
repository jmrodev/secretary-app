# Archive Report: finance-debt-on-appointment-delete

**Archived**: 2026-08-17
**Archived to**: `openspec/changes/archive/2026-08-17-finance-debt-on-appointment-delete/`
**Mode**: openspec (file-based)
**Verdict at close**: PASS — cycle complete
**Artifact store source of truth**: filesystem (`openspec/`)

## Final State (at close)

- **Tasks**: 19/19 complete, all `[x]` in the persisted `tasks.md` (Task Completion Gate passed — no unchecked implementation tasks, no reconciliation needed). Strict TDD: every phase RED→GREEN with a matching test suite.
- **Implementation**:
  - New `DebtLifecycleService` (`server/services/finance/debtLifecycleService.js`) centralizes the R1-R7 policy: `handleAppointmentDelete`, `handleAppointmentStatusChange`, `handleRequestDelete`, all executed on the **same `conn`** as the owning operation's transaction.
  - `transactionRepository` gained 5 helpers: `findByAppointmentId`, `findByRequestId`, `detachAndLabel(ids, label, conn)` (idempotent `NOT LIKE` label guard), `deletePendingByAppointmentId`, `deletePendingByRequestId`.
  - `modificationService.js` (`deleteAppointment` / `updateStatus`) and `MedicalRequestService.js` (`deleteRequest`) wired atomically on the shared `conn`; R4 fix: `absent` no longer nulls `payment_status` (kept → debt counts and is charged); `suspended` legacy behavior preserved (delete pending + null `payment_status`).
  - `financeListener.js` deleted (all branches dead); `MEDICAL_REQUEST_CREATED/UPDATED/DELETED` constants removed from `eventConstants.js` (grep 0 users); `app.js` no longer requires the listener.
  - google-sync/audit emissions preserved — `APPOINTMENT_DELETED`/`CANCELLED`/`COMPLETED` emits intact and still consumed by `appointmentListeners.js` (unchanged).
  - D1 one-off maintenance script `server/scripts/maintenance/cleanup-orphan-debt.js` (label guard + `rental_id IS NULL` + `--dry-run` default) subsumes `fix_orphans.sql`.
- **Verification**: `pnpm --filter server test` → exit 0, 24 suites / 168 tests pass (0 failures, ~2.5 s); `pnpm --filter server lint` → exit 0, 0 errors / 23 warnings (all pre-existing, none introduced by the change). `gentle-ai sdd-verify-validate` verdict **PASS**: 14/14 requirements, 22/22 scenarios (9 req / 14 scenarios `appointment-debt-lifecycle`; 5 req / 8 scenarios `request-debt-lifecycle`). 0 CRITICAL / 0 WARNING findings; 3 low-priority SUGGESTIONs recorded (no-emit assertion, vestigial suspended null on delete path, D1 shared-pool conn — all informational).
- **User-resolved decisions** (authoritative, applied during apply):
  - D1 cleans **ALL** unlabeled pending orphans, including dangling `appointment_id` orphans (subsumes `fix_orphans.sql`), guarded by the label prefix and `--dry-run`.
  - `suspended` keeps legacy behavior (delete pending, null `payment_status`).

## Specs Synced (delta → main)

| Domain | Action | Details |
|--------|--------|---------|
| `appointment-debt-lifecycle` | Created (main spec did not exist) | 9 requirements / 14 scenarios (R1-R6, atomicity, dead listener removal, D1/D2) |
| `request-debt-lifecycle` | Created (main spec did not exist) | 5 requirements / 8 scenarios (R7, atomicity, dead listeners, D1/D2) |

Both delta specs were full specs (not partial deltas) for new capability domains; copied mechanically into `openspec/specs/{domain}/spec.md` per the Mechanical Copy Contract. No pre-existing main spec was modified, so no requirement was added/modified/removed/renamed — the finalized policy is now the source of truth in `openspec/specs/`.

## Mechanical Copy Evidence (verbatim `diff -r` output)

Spec sync readbacks (both empty — byte-identical):

```
--- diff -r (spec sync) appointment-debt-lifecycle ---
--- diff -r (spec sync) request-debt-lifecycle ---
```

Archive move readback (empty — byte-identical):

```
--- diff -r (archive move readback; must be empty) ---
```

Empty diffs are the only passing evidence; no model-mediated copy was used for any artifact.

## Archive Contents

- proposal.md ✅
- exploration.md ✅ (optional artifact from sdd-explore)
- specs/appointment-debt-lifecycle/spec.md ✅
- specs/request-debt-lifecycle/spec.md ✅
- design.md ✅
- tasks.md ✅ (19/19 tasks complete)
- apply-progress.md ✅
- verify-report.md ✅ (verdict PASS)
- archive-report.md ✅ (this file — additive, excluded from readback)

Active changes directory no longer contains this change.

## Delivery Note

Delivery is a **single PR with a pre-approved `size:exception`** (accepted 2026-08-17 by the user; no chained PRs — the ~400-line work exceeded the 400-line default review budget and the exception was recorded). The PR has **NOT yet been created** — the orchestrator handles delivery gates (branch, PR creation, push). At archive time the change sits uncommitted on `development` per `verify-report` (evidence base HEAD `7769c107` + working tree), consistent with delivery being the orchestrator's next step.

## Contradiction Register

None. All sources agree on final state; no unrankable contradictions were found. `apply-progress.md` and `verify-report.md` (intermediate snapshots) both report completion consistent with the persisted `tasks.md` and the final-state facts provided at archive launch.

## Notes

- File modes of the synced main specs (`-rw-------`) are a side effect of the mandated temp-file copy mechanism; content is byte-identical per the readbacks above.
- Rollback remains `git revert` of the change (no schema change; labels are description prefixes that do not affect payment logic).
- The D1 script runs once post-deploy via `node scripts/maintenance/cleanup-orphan-debt.js` (dry-run default); it was not executed against a live DB during the cycle.