# Tasks: Supervised WhatsApp Auto-Booking

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,300–1,600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Backend → Frontend → Integration |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | DB + repo + backend endpoints | PR 1 | `pnpm --filter server test whatsappAiService` | POST `/api/whatsapp/ai-suggestion`; patient confirms slot → verify pending row, no appointment | git revert server commit + `DROP TABLE whatsapp_pending_bookings` |
| 2 | Frontend queue UI + context | PR 2 | `pnpm --filter client test` | dev server with seeded pending row; verify banner + accept flow | git revert client commit |
| 3 | Integration + race tests | PR 3 | `pnpm --filter server test -- integration` | two parallel curl `accept` → one `taken` | revert test-only commit |

## Phase 1: Database + Repository Foundation

- [x] 1.1 Create `server/scripts/migrations/25_whatsapp_pending_bookings.sql` (table + `doctors.pending_response_template`); applied manually via mysql CLI per existing migration convention
- [x] 1.2 RED: `pendingBookingRepository.test.js` — create/findActive/acceptById/suggestAlternative/rejectById fail (repo missing)
- [x] 1.3 Create `server/repositories/communication/pendingBookingRepository.js` — pool queries; `acceptById` = `UPDATE ... SET status='accepted' WHERE id=? AND status='pending'` (optimistic lock)
- [x] 1.4 GREEN: Jest passes for repository
- [x] 1.5 Add `pending_response_template` to `ALLOWED_FIELDS` in `server/repositories/user/doctorRepository.js`

## Phase 2: Backend (Service, Controller, Routes)

- [x] 2.1 RED: extend `server/services/communication/whatsappAiService.test.js` — `_tryAutoBook()` inserts pending (never `createAppointment`); `_buildContext()` sets `hasPendingBooking`
- [x] 2.2 Modify `whatsappAiService.js`: `_tryAutoBook()` INSERT pending + "en revisión" reply; `_buildContext()` adds pending flag; pending-state reply uses `pending_response_template` with default fallback
- [x] 2.3 GREEN: whatsappAiService tests pass
- [x] 2.4 Add `whatsappController.js` handlers: `listPending` (with 2h alternative timeout cleanup), `acceptPending` (createAppointment, phone-change guard, slot-taken → rejected), `suggestAlternative`, `rejectPending`
- [x] 2.5 Register 4 endpoints in `server/routes/communication/whatsappRoutes.js` (verifyToken)

## Phase 3: Frontend (Context, Components, Wiring)

- [ ] 3.1 Create `client/src/api/pendingBookingApi.js` (wraps `@/api/axios`: list/accept/suggestAlternative/reject)
- [ ] 3.2 RED: vitest `PendingApprovalContext.test.jsx` — 10s poll starts/stops on unmount; actions call api
- [ ] 3.3 Create `client/src/context/PendingApprovalContext.jsx` (polling, accept/suggestAlternative/reject/refresh); GREEN
- [ ] 3.4 Create `PendingBookingBanner.jsx` + `.module.css` in `client/src/features/communication/components/` (fixed-bottom trigger, RescheduleBanner pattern)
- [ ] 3.5 Create `PendingApprovalQueue.jsx` + `.module.css` in same dir (Accept / Suggest Alternative via SlotExplorerDropdown / Reject)
- [ ] 3.6 Mount context + queue in `client/src/components/templates/MainLayout.jsx`
- [ ] 3.7 Add `pending_response_template` field to `client/src/features/whatsapp/WhatsappConfig.jsx`

## Phase 4: Integration + Tests + Documentation

- [ ] 4.1 Integration (node-mocks-http + pool): accept flow — appointment created, pending `accepted` (spec 2.1)
- [ ] 4.2 Integration: concurrent accept — one wins, second sees `taken` (spec 4.1)
- [ ] 4.3 Integration: phone change → auto-reject (spec 5.1); suggest → webhook "yes" books (spec 3.1)
- [ ] 4.4 Run `pnpm lint` + `pnpm --filter server test` + `pnpm --filter client test`; all green
