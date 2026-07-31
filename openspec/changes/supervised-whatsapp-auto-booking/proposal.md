# Proposal: Supervised WhatsApp Auto-Booking

## Intent

Eliminate the risk of AI making unauthorized appointments. When a patient confirms a slot via WhatsApp, the system must pause, surface a pending booking to the secretary for approval, and only create the appointment after explicit secretary action — with a fallback to suggest alternatives.

## Scope

### In Scope
- Intercept `_tryAutoBook()` to create pending bookings instead of direct appointments
- Persistent approval queue (visible across all pages, non-blocking)
- Accept flow: secretary accepts → appointment created → AI notifies patient
- Suggest Alternative flow: secretary picks slot via SlotExplorerDropdown → AI asks patient → auto-book on confirmation
- Alternative timeout (2h): auto-reject + notify secretary
- AI re-detection guard: polite "please wait" during active pending
- Slot-taken guard: graceful handling if slot got booked before approval
- Configurable pending-state AI response template (editable from config page)
- New `whatsapp_pending_bookings` table + repository
- PendingApprovalContext with polling
- Global PendingApprovalQueue + PendingBookingBanner components

### Out of Scope
- Auto-TTL or automatic expiry (every booking requires manual resolution)
- Per-secretary assignment or access control (all secretaries see all pending)
- Email or push notifications for pending bookings (WhatsApp AI notification only)
- Audit trail beyond what the pending booking table provides
- Historical view of resolved pending bookings

## Capabilities

### New Capabilities
- `whatsapp-pending-booking`: Persistent pending booking table, repository, lifecycle (create → accept/suggest/reject), slot-taken guard, alternative timeout

### Modified Capabilities
- `communication`: WhatsApp AI flow modified — `_tryAutoBook()` creates pending instead of direct appointments; AI response templates extended with pending-state config

## Approach

1. **Backend**: `_tryAutoBook()` inserts into `whatsapp_pending_bookings` instead of calling `bookingService.createAppointment()`. New repository + DB migration. Accept endpoint calls existing `createAppointment()`; Suggest Alternative creates pending with `alternative_slot_id`, AI sends question, webhook handles patient reply.
2. **Frontend**: `PendingApprovalContext` polls `GET /api/pending-bookings` every 10s. `PendingApprovalQueue` renders in `MainLayout` as a fixed-position collapsible panel. `PendingBookingBanner` is the collapsed trigger. `SlotExplorerDropdown` is instantiated independently for the Suggest Alternative flow.
3. **AI Config**: Extend WhatsApp AI config schema with `pending_response_template` field, saved alongside existing `gemini_context` etc.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `server/services/communication/whatsappAiService.js` | Modified | `_tryAutoBook()` creates pending; `_buildContext()` flags active pending |
| `server/services/appointments/bookingService.js` | Reused | `createAppointment()` reused as-is on Accept |
| `server/routes/communication/whatsappRoutes.js` | Modified | + `GET/POST /pending-bookings/*` endpoints |
| `server/controllers/communication/whatsappController.js` | Modified | Handlers for accept, suggest, reject pending |
| `server/repositories/communication/` | **New** | `pendingBookingRepository.js` + `whatsapp_pending_bookings` migration |
| `client/src/context/PendingApprovalContext.jsx` | **New** | Polling context, exposes pending list + actions |
| `client/src/layouts/MainLayout.jsx` | Modified | Mount PendingApprovalQueue globally |
| `client/src/features/communication/components/PendingApprovalQueue.jsx` | **New** | Full queue: Accept/Suggest/Reject per item |
| `client/src/features/communication/components/PendingBookingBanner.jsx` | **New** | Collapsed persistent trigger banner |
| `client/src/features/appointments/components/ui/SlotExplorerDropdown.jsx` | Reused | Alternative slot picker (standalone instantiation) |
| WhatsApp AI config page | Modified | New `pending_response_template` field |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Concurrent approval race (two secretaries accept same pending) | Low | Optimistic lock `WHERE status = 'pending'`; second secretary sees "Accepted by [name]" in queue (resolved) |
| Slot becomes occupied before approval | Medium | Slot-taken guard catches `sp_book_appointment` error; secretary notified gracefully |
| Patient changes phone number | Low | Pending rejected automatically; secretary notified (resolved) |
| Polling overhead with many pending | Low | Poll interval 10s; pending count expected small (<20) |

## Rollback Plan

**Revert DB**: `DROP TABLE IF EXISTS whatsapp_pending_bookings;` in a rollback migration.
**Revert server**: `git revert` the server commit — `_tryAutoBook()` resumes direct booking.
**Revert client**: `git revert` the client commit — `MainLayout` no longer mounts queue components.
**No data loss**: pending bookings are ephemeral; any unapproved are lost on rollback (acceptable).

## Dependencies

- Existing `sp_get_free_slots` stored procedure (unchanged)
- Existing `sp_book_appointment` stored procedure (unchanged)
- `SlotExplorerDropdown` component (reused)
- `RescheduleBanner` CSS pattern (reference)

## Success Criteria

- [ ] Patient confirms slot → pending booking created, NOT appointment
- [ ] Secretary accepts → appointment created → patient receives WhatsApp confirmation
- [ ] Secretary suggests alternative → patient receives question → yes/no handled
- [ ] 2h timeout on alternative → auto-rejected, secretary notified
- [ ] Patient sends message while pending → AI responds with configurable "please wait"
- [ ] Slot taken before approval → graceful error, secretary notified
- [ ] Pending queue visible from all pages, non-blocking
- [ ] Pending-state response template editable from AI config page

## Proposal question round

Before finalizing this proposal, I need to clarify a few business rules that affect scope and implementation:

1. **Who can see/approve pending bookings?** Should ALL secretaries see every pending booking in the queue, or should bookings be assigned to a specific secretary (e.g., the one who manages that doctor's calendar)?

2. **What happens if the patient's phone number changes** between the pending being created and the secretary approving? Should we reject automatically, warn the secretary, or ignore?

3. **Should the secretary be able to add an internal note** when suggesting an alternative? (e.g., "Paciente prefiere turnos a la mañana" — visible only to staff)

4. **What if two secretaries try to accept the same pending simultaneously?** Should we use a first-wins model (second gets an error) or implement a locking strategy?

Please answer, skip any you're unsure about, or correct the framing.
