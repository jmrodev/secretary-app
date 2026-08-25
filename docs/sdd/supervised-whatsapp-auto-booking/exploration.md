## Exploration: Supervised WhatsApp Auto-Booking with Alternative Slot Suggestion

### Current State

**Backend flow (`_tryAutoBook` in `whatsappAiService.js`):**
1. `getAiSuggestion(patientId, phone, doctorId, userId)` is called from `POST /api/whatsapp/ai-suggestion`
2. `_buildContext()` loads doctor data, schedules, holidays, free slots via `availabilitySearchService.getFreeSlotsBatch()`, and last patient message
3. `_tryAutoBook()` checks if the last patient message matches a time confirmation regex (e.g., "si al de las 9")
4. If matched, it searches `context.freeSlots` for the requested time
5. On match, calls `bookingService.createAppointment()` immediately with `role='secretary'` and reason `'Turno solicitado por WhatsApp'`
6. Returns a success/error string that becomes the AI's response message to the patient
7. `slot_already_taken` is detected as a string match in the error from `sp_book_appointment` stored procedure

**WhatsApp messages storage (`whatsapp_messages` table via `whatsappRepository`):**
- Fields: `patient_id`, `sender_phone`, `direction` (inbound/outbound), `body`, `whatsapp_id`, `status`, `created_at`
- History retrieved via `getHistoryByPatient(patientId, phone)` which queries by `patient_id` OR phone digits
- AI context uses last N messages (configurable per-doctor via `gemini_history_limit`) and the last inbound message for auto-detection

**Doctor schedule enforcement:**
- `_buildContext()` loads `doctor_schedules` table via `scheduleRepository.findByDoctor()` — fields: `doctor_id`, `day_of_week`, `start_time`, `end_time`, `is_break`, `default_type`, `force_hour_alignment`
- Schedules are formatted into `{doctor_schedule}` placeholder in the AI prompt (filtering out `is_break` entries)
- Free slots come from `sp_get_free_slots` stored procedure, which handles schedule filtering, break exclusion, holiday blocking, and existing appointment conflicts at the DB level
- The AI receives `{free_slots}` as a pre-computed list — it does NOT calculate availability itself

**Frontend patterns:**
- `useMessage`/`MessageContext`: Toast-style messages that auto-clear after 3s — NOT persistent
- `RescheduleBanner`: The existing persistent banner pattern — `position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%)`, z-index 1000, backdrop blur, slide-up animation. Used in `AppointmentsPage` only.
- `SlotExplorerDropdown`: Well-decoupled presentational component (12 props including `isOpen`, `onSelect`, `slotPages`, `jumpToMonth`, etc.), but lifecycle is managed by `useNextFreeSlot` hook which is instantiated inside `AppointmentsPage`
- `FloatingChat`: Global floating chat widget rendered independently of page — good reference for persistent UI that survives navigation
- `GlobalWhatsappMessenger`: Global WhatsApp management sidebar rendered in `App.jsx`
- `AppointmentsModals`: Orchestrates all appointment-related modals in one place within the page

### Affected Areas

- `server/services/communication/whatsappAiService.js` — `_tryAutoBook()` needs to return a "pending approval" marker instead of booking immediately; `getAiSuggestion()` caller needs to distinguish pending state from success
- `server/services/appointments/bookingService.js` — `createAppointment()` will be called from the approval endpoint, not from AI; needs to detect `slot_already_taken` gracefully
- `server/routes/communication/whatsappRoutes.js` — needs new endpoints: `GET /pending-bookings`, `POST /pending-bookings/:id/accept`, `POST /pending-bookings/:id/suggest-alternative`
- `server/controllers/communication/whatsappController.js` — needs new handler functions for pending booking lifecycle
- `server/repositories/communication/whatsappRepository.js` — may need a related `whatsapp_pending_bookings` repository
- `client/src/context/MessageContext.jsx`/`useMessageLogic.js` — NOT suitable for persistent banner (auto-clear); need new context
- `client/src/features/appointments/components/ui/SlotExplorerDropdown.jsx` — reusable as-is but needs new hook instance in the banner
- `client/src/features/appointments/hooks/useNextFreeSlot.js` — `fetchNextFreeSlots` can be reused but needs standalone instantiation
- `client/src/components/templates/MainLayout.jsx` — likely home for the persistent banner (alongside FloatingChat)
- `client/src/App.jsx` — alternative banner placement at global level
- `client/src/features/appointments/components/ui/RescheduleBanner.jsx` — reference for styling/positioning
- Database — new table needed for pending bookings

### Approaches

1. **New `whatsapp_pending_bookings` table + `PendingApprovalContext` + polling**
   - Create `whatsapp_pending_bookings(patient_id, doctor_id, requested_date, requested_time, suggested_alternative, status[pending/approved/rejected], message_id, created_at, expires_at)`
   - Intercept `_tryAutoBook()` to INSERT into this table and return pending status
   - Frontend: `PendingApprovalContext` polls `GET /whatsapp/pending-bookings` every 10s
   - `PendingApprovalBanner` component (modeled on `RescheduleBanner`) rendered in `App.jsx` or `MainLayout`
   - Banner shows: patient name, requested slot, Accept / Suggest Alternative buttons
   - Accept → `POST /whatsapp/pending-bookings/:id/accept` → calls `createAppointment` → on success, `sendMessageDirect` to notify patient → marks as approved
   - Suggest Alternative → inline drawer with `SlotExplorerDropdown` → secretary picks slot → `POST /whatsapp/pending-bookings/:id/alternative` → AI sends message to patient with new proposal
   - Pros: Clean separation, persistent across navigation, reuses existing patterns (RescheduleBanner, SlotExplorerDropdown), polling is already used by FloatingChat
   - Cons: Polling adds DB load, need stale-pending cleanup (TTL), concurrency handling
   - Effort: High (backend + frontend + database)

2. **Stateful context without DB — emit pending status in AI response + WebSocket push**
   - Modify `_tryAutoBook()` to return a "pending" marker embedded in the AI response
   - Frontend parses AI response, finds pending markers, creates local state
   - Uses WebSocket or SSE to push pending states from server
   - Same banner pattern but without polling
   - Pros: No new table, real-time
   - Cons: State lost on refresh, no audit trail, no TTL enforcement, WebSocket infrastructure needed, complex
   - Effort: Medium-High (WebSocket infra + state management)

3. **Simple: Extend `whatsapp_messages` with `booking_status` column + page-level banner**
   - Add `booking_status` (null/pending/approved/rejected) and `slot_date` columns to `whatsapp_messages`
   - `_tryAutoBook()` updates the last inbound message's `booking_status = 'pending'` and `slot_date` instead of booking
   - Frontend checks message status on page load (only on Messages/Appointments pages)
   - Banner shown only on those pages
   - Pros: Minimal DB changes, simple
   - Cons: Banner not persistent across pages, no dedicated API for polling, mixed concerns on messages table, limited to page-level
   - Effort: Low-Medium

### Recommendation

**Approach 1 (New table + polling + global context)** — it's the most robust, follows existing patterns (FloatingChat uses polling, RescheduleBanner uses fixed positioning), keeps clean separation of concerns, and survives page navigation. The polling interval can be tuned (10-15s like FloatingChat) to minimize DB load. A TTL cleanup (e.g., auto-reject after 24h) solves stale pending bookings.

Key architectural decisions for the design phase:
- `_tryAutoBook()` returns a structured response `{ status: 'pending', pendingId, message: 'Consulto con la Secretaría...' }` instead of a plain text success string
- `getAiSuggestion()` wraps structured responses so the API distinguishes auto-reply vs pending
- New `PendingApprovalBanner` component in the style of `RescheduleBanner` (fixed bottom, backdrop blur)
- `PendingApprovalContext` stores pending bookings and exposes `acceptPending()`, `suggestAlternative()` actions
- `SlotExplorerDropdown` instantiated inside the banner when secretary clicks "Suggest Alternative"
- On accept: `createAppointment` is called, patient notified via `sendMessageDirect`, status updated
- On alternative suggested: API calls `getAiSuggestion` with the new slot info to generate a natural proposal to the patient

### Risks

- **Concurrent access**: Two secretaries could see the same pending booking. First Accept wins (detected via status check + `slot_already_taken` from `sp_book_appointment`). Optimistic lock using `WHERE status = 'pending'` in the UPDATE query.
- **Stale free slots**: When the secretary clicks "Suggest Alternative", the free slots shown must be fresh — always re-fetch from the server, never use cached data from the AI context.
- **Slot taken while pending**: During the time between patient confirmation and secretarial approval, the slot could be booked by another channel. The `acceptPending()` endpoint must call `createAppointment()` which detects `slot_already_taken` and returns an appropriate error.
- **Go bridge session expiry**: WhatsApp bridge session could expire while a booking is pending. The `sendMessageDirect` call in the accept/suggest flow must handle failure gracefully — queue the message or alert the secretary.
- **AI prompt timing**: If the patient sends another message while the booking is pending, the AI must not re-detect a confirmation. The pending booking status should be included in the AI context.
- **Stale pending bookings**: Without TTL, pending bookings could be forgotten. A scheduled cleanup (e.g., `DELETE ... WHERE created_at < NOW() - INTERVAL 24 HOUR AND status = 'pending'`) or a cron job is needed.

### Ready for Proposal

Yes — the exploration is complete. All key files have been read, the flow is understood end-to-end, and the recommendation is clear (Approach 1). The orchestrator should tell the user:
- The investigation is done
- The recommendation is a new `whatsapp_pending_bookings` table + `PendingApprovalContext` with polling + a global `PendingApprovalBanner` modeled on `RescheduleBanner`
- The `SlotExplorerDropdown` can be reused as-is but needs its own hook instance
- Concurrency and stale data risks are identified with mitigation strategies
- Ready to move to the Proposal phase
