# Design: Supervised WhatsApp Auto-Booking

## Technical Approach

Intercept `_tryAutoBook()` to INSERT into `whatsapp_pending_bookings` (status `pending`) instead of calling `bookingService.createAppointment()`. A new `PendingApprovalContext` polls `GET /api/whatsapp/pending-bookings` every 10s. The queue renders in a global fixed-position banner (modeled on `RescheduleBanner` CSS pattern). Accept calls the existing `createAppointment()`. Suggest Alternative reuses `SlotExplorerDropdown` independently; the AI sends the proposal and a webhook handles the patient's reply. Optimistic lock `WHERE status = 'pending'` ensures first-wins concurrency.

## Architecture Decisions

### Decision: Polling vs WebSocket

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Polling (10s) | Simple, no infra changes, matches `FloatingChat` polling pattern | **Chosen** |
| WebSocket | Real-time, but adds connection management; overengineered for <20 pending items | Rejected |

### Decision: Global context vs page-level state

**Chosen**: `PendingApprovalContext` wrapping the entire app (mounted in `MainLayout`). The queue must be visible from ALL pages. Context provides shared state + polling lifecycle in one place.

### Decision: Optimistic locking for concurrent approval

**Chosen**: Single `UPDATE whatsapp_pending_bookings SET status = 'accepted_by', accepted_at = NOW() WHERE id = ? AND status = 'pending'`. MySQL row-level locking means only one secretary wins; the second sees 0 affectedRows and receives `{ status: 'taken', accepted_by: name }`. No explicit `SELECT ... FOR UPDATE` needed — the atomic `WHERE status = 'pending'` guard is sufficient.

### Decision: SlotExplorerDropdown reuse pattern

**Chosen**: Instantiate independently in `PendingApprovalQueue` — it's already a self-contained component with its own fetch/pagination logic. A thin wrapper `AlternativeSlotPicker` (molecule) passes `onSelect` to create the alternative and avoids coupling the queue to the dropdown's internals.

## Data Flow

```
Patient WhatsApp → Webhook → whatsappAiService.getAiSuggestion()
                                    ↓
                             _tryAutoBook()
                                    ↓
                      INSERT whatsapp_pending_bookings
                      (status='pending', patient_phone, doctor_id,
                       requested_slot_date, requested_slot_time)
                                    ↓
                      AI returns "Tu solicitud está en revisión..."
                                    ↓
                    ┌─── PendingApprovalContext polls GET /pending-bookings ───┐
                    │                        10s                              │
                    ▼                                                         │
            PendingApprovalQueue (global fixed banner)                       │
                    │                                                        │
         ┌──────────┼──────────────┐                                         │
         ▼          ▼              ▼                                         │
       Accept  Suggest Alt.    Reject                                         │
         │          │              │                                          │
         ▼          ▼              └──→ UPDATE status='rejected'              │
   createAppointment()  ┌──────────┘                                         │
   + UPDATE status=     │                                                    │
   'accepted'           ▼                                                    │
                  SlotExplorerDropdown                                       │
                  → POST /pending-bookings/:id/suggest                       │
                  → AI sends question via WhatsApp                           │
                  → Patient replies → webhook handles yes/no                 │
                    → Yes: auto-book, No: notify secretary                   │
                    → 2h timeout: auto-reject + notify secretary             │
                                                                             │
  Patient messages while pending → AI uses pending_response_template ────────┘
```

## Database Schema

### New: `whatsapp_pending_bookings`

```sql
CREATE TABLE IF NOT EXISTS `whatsapp_pending_bookings` (
    `id`                    INT(11)       NOT NULL AUTO_INCREMENT,
    `patient_id`            INT(11)       NOT NULL,
    `doctor_id`             INT(11)       NOT NULL,
    `patient_phone`         VARCHAR(50)   NOT NULL,
    `requested_slot_date`   DATE          NOT NULL,
    `requested_slot_time`   VARCHAR(5)    NOT NULL,
    `status`                ENUM('pending','accepted','rejected','alternative_sent','alternative_accepted','alternative_rejected','timed_out') NOT NULL DEFAULT 'pending',
    `accepted_by`           INT(11)       DEFAULT NULL,
    `accepted_at`           TIMESTAMP     NULL DEFAULT NULL,
    `alternative_slot_iso`  VARCHAR(30)   DEFAULT NULL,
    `alternative_note`      TEXT          DEFAULT NULL,
    `alternative_sent_at`   TIMESTAMP     NULL DEFAULT NULL,
    `rejected_by`           INT(11)       DEFAULT NULL,
    `rejected_reason`       VARCHAR(255)  DEFAULT NULL,
    `appointment_id`        INT(11)       DEFAULT NULL,
    `created_at`            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_wpb_status`       (`status`),
    KEY `idx_wpb_patient`      (`patient_id`),
    KEY `idx_wpb_doctor`       (`doctor_id`),
    KEY `idx_wpb_phone`        (`patient_phone`),
    CONSTRAINT `fk_wpb_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_wpb_doctor`  FOREIGN KEY (`doctor_id`)  REFERENCES `doctors`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### Modified: `doctors` table

Add column (via ALTER TABLE in the same migration):

```sql
ALTER TABLE `doctors`
  ADD COLUMN `pending_response_template` TEXT DEFAULT NULL
  AFTER `gemini_api_version`;
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/whatsapp/pending-bookings` | verifyToken | List all active pending bookings |
| `POST` | `/api/whatsapp/pending-bookings/:id/accept` | verifyToken | Accept pending → create appointment |
| `POST` | `/api/whatsapp/pending-bookings/:id/suggest-alternative` | verifyToken | Suggest alternative slot with optional note |
| `POST` | `/api/whatsapp/pending-bookings/:id/reject` | verifyToken | Reject pending (with optional reason) |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| **Server** | | |
| `server/scripts/migrations/25_whatsapp_pending_bookings.sql` | Create | New table + `doctors.pending_response_template` column |
| `server/repositories/communication/pendingBookingRepository.js` | Create | CRUD for pending bookings (create, findActive, acceptById, suggestAlternative, rejectById, findByPatient) |
| `server/services/communication/whatsappAiService.js` | Modify | `_tryAutoBook()` inserts into pending table; `_buildContext()` adds `hasPendingBooking` flag; AI uses `pending_response_template` when pending |
| `server/controllers/communication/whatsappController.js` | Modify | Add handlers: `listPending`, `acceptPending`, `suggestAlternative`, `rejectPending` |
| `server/routes/communication/whatsappRoutes.js` | Modify | Register 4 new pending-booking endpoints |
| `server/repositories/user/doctorRepository.js` | Modify | Add `pending_response_template` to `ALLOWED_FIELDS` |
| `server/services/communication/whatsappAiService.test.js` | Modify | Update tests for pending-booking flow |
| **Client** | | |
| `client/src/context/PendingApprovalContext.jsx` | Create | Global context with 10s polling, exposes pending list + actions (accept/suggest/reject) |
| `client/src/features/communication/components/PendingApprovalQueue.jsx` | Create | Full queue panel (organism): lists all pending with Accept / Suggest Alternative / Reject buttons |
| `client/src/features/communication/components/PendingApprovalQueue.module.css` | Create | Styles for the queue panel |
| `client/src/features/communication/components/PendingBookingBanner.jsx` | Create | Collapsed trigger banner (molecule): shows count, expands on click |
| `client/src/features/communication/components/PendingBookingBanner.module.css` | Create | Styles for the banner (matching `RescheduleBanner` fixed-bottom pattern) |
| `client/src/components/templates/MainLayout.jsx` | Modify | Mount `PendingApprovalContext` and `PendingApprovalQueue` |
| `client/src/features/appointments/components/ui/SlotExplorerDropdown.jsx` | Reused | Standalone instantiation for Suggest Alternative flow |

## Interfaces / Contracts

### Pending Booking API response shape

```js
// GET /api/whatsapp/pending-bookings
{ "success": true, "data": [
  { "id": 1, "patient_name": "Juan Pérez", "doctor_name": "Dr. House",
    "patient_phone": "5491112345678", "requested_slot_date": "2026-08-03",
    "requested_slot_time": "09:00", "status": "pending",
    "created_at": "2026-08-03T14:30:00.000Z" }
]}

// POST /api/whatsapp/pending-bookings/:id/accept
{ "success": true, "appointment_id": 456 } // First-wins
{ "success": false, "status": "taken", "accepted_by": "Ana (Secretaria)" } // Lost race

// POST /api/whatsapp/pending-bookings/:id/suggest-alternative
// Body: { alternative_slot_iso: "2026-08-05T10:00:00", note: "Prefiere turnos mañana" }
{ "success": true, "message": "Alternative sent to patient" }

// POST /api/whatsapp/pending-bookings/:id/reject
// Body: { reason: "Paciente no responde" }
{ "success": true }
```

### PendingApprovalContext shape

```js
const { pendingItems, loading, accept, suggestAlternative, reject, refresh } = usePendingApproval();
// pendingItems: array of pending booking objects
// accept(id): Promise → { appointmentId } or throws with conflict info
// suggestAlternative(id, slotIso, note): Promise
// reject(id, reason): Promise
// refresh(): force immediate re-poll
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `pendingBookingRepository` | Mock pool, test all CRUD methods |
| Unit | `_tryAutoBook()` create pending (modified) | Mock repo, verify INSERT happens instead of `createAppointment()` |
| Unit | `_buildContext()` pending flag | Mock repo to return pending for a patient, verify `hasPendingBooking` in context |
| Unit | `PendingApprovalContext` polling | Mock fetch, verify 10s interval starts/stops on unmount |
| Integration | Accept flow (controller + service) | `node-mocks-http` + real pool transaction; verify appointment created + pending accepted first-wins |
| Integration | Concurrent accept race | Two parallel requests; verify one succeeds, one sees `taken` |
| Integration | Suggest alternative → webhook reply | Simulate AI sending question and patient replying "yes" |
| Integration | Phone change rejection | Create pending with phone X, change patient phone to Y, accept → verify rejected |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required beyond the SQL migration file. Feature flag optional — pending_response_template defaults to NULL, system provides a hardcoded fallback string. The change is additive (new table, new column, new endpoints), no breaking contract changes.

## Open Questions

- [ ] Should Suggest Alternative also trigger an internal notification to the secretary when the patient replies?
- [ ] Does the `pool` in `PendingApprovalContext` polling need to survive navigation between SPA pages? (Context is mounted in MainLayout, so yes — it stays alive across page transitions.)
