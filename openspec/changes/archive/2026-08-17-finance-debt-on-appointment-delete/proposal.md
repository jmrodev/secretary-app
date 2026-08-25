# Proposal: Finance Debt on Appointment Delete

## Intent
Debt policy is inconsistent: cancel deletes pending debt; delete keeps it as an unlabeled orphan (FK `ON DELETE SET NULL`; listener matches 0 rows); absent deletes it too. R1: debt exists ONLY if service rendered. Goal: deterministic, labeled, atomic retention — same for medical requests.

## Business Rules (user, 2026-08-17)
| # | Rule (textual) |
|---|---|
| R1 | "Un servicio que no se dio no se registra deudor el paciente." |
| R2 | Eliminar turno asistido → la deuda se mantiene; un turno que se debe no se elimina. |
| R3 | Eliminar turno sin servicio (futuro) → la deuda se elimina. |
| R4 | Ausente → la deuda se mantiene y se cobra (hoy se borra). |
| R5 | Cancelado → la deuda se elimina (actual, correcto). |
| R6 | Turno pagado eliminado: no asistió → ingreso se cobra; cancelado → saldo a favor. |
| R7 | Solicitud eliminada antes de realizarse → deuda eliminada; realizada → se endeuda. |

## Scope
**In:** R1-R6 delete/absent/cancel flows (atomic `conn`); R7 request-delete; labels "Deuda (Turno Eliminado)"/"Saldo a favor"; dead listener branches.
**Out:** UI modal (deterministic policy); full bus redesign; `countFiltered` bug; orphan migration (open).

## Capabilities
**New:** `appointment-debt-lifecycle` (R1-R6); `request-debt-lifecycle` (R7).
**Modified:** none — lifecycle debt unspec'd; `appointment-pricing`, `debt-settlement`, `doctor-finances` unchanged.

## Approach
Exploration option 1+4: in delete tx (same `conn`), convert pending rows to labeled standalone debt; R6 "Saldo a favor" rename; fix absent path (R4); align request delete (R7); remove dead listener code.

## Affected Areas
| Area | Impact |
|---|---|
| `modificationService.js` | Debt retention R2/R3/R6; absent R4 |
| `financeListener.js` | Dead branches removed |
| `MedicalRequestService.js` | R7 |
| `transactionRepository.js` | Label/detach helpers |

## Design Decisions (→ sdd-design)
At-delete mapping: `appt.status` (completed/absent→R2; scheduled→R3; cancelled→R5/R6) + `payment_status`; placement: service (`conn`) vs listener — recommend service.

## Risks
| Risk | Likelihood |
|---|---|
| R4 absent-now-charges surprises ops | Med |
| Existing orphans unlabeled | High |
| Listener removal breaks google sync | Low |

## Rollback Plan
No schema change → git revert restores behavior; labels don't affect payment logic. Orphan migration, if any, reverses via `UPDATE`.

## Success Criteria
- [ ] Attended delete keeps labeled pending debt; future delete removes debt.
- [ ] Absent keeps+charges; cancel removes; paid: cancelled → "Saldo a favor", no-show → income kept; request: before-performed drops, performed keeps; dead listener gone; tests green.

## Proposal Question Round
1. Migrate orphans (one-off labeling) or accept?
2. Include comm reorg (dead listeners removal)?
3. R4 not retroactive?
4. No UI modal?
5. R7 in this change?