# WhatsApp Pending Booking Specification

## Purpose

Pending booking queue that intercepts AI slot confirmations, requiring secretary approval before appointment creation.

## Requirements

### Requirement 1: Pending Booking Lifecycle

The system MUST maintain a `whatsapp_pending_bookings` table with statuses: `pending` → `accepted` / `suggested` / `rejected`. The repository MUST enforce valid transitions.

#### Scenario 1.1: Patient confirms slot → pending created

GIVEN the AI matched a patient's intent to a specific free slot
WHEN `_tryAutoBook()` executes
THEN a row SHALL be created with status `pending`
AND no appointment SHALL be created
AND the patient SHALL receive a pending-approval message

### Requirement 2: Accept Flow and Slot-Taken Guard

On acceptance, the system MUST attempt `bookingService.createAppointment()`. On success, status becomes `accepted` with `accepted_by`. On failure (slot taken), status becomes `rejected` and the secretary is notified.

#### Scenario 2.1: Secretary accepts → appointment created

GIVEN a pending booking exists with an available slot
WHEN a secretary calls `POST /api/pending-bookings/:id/accept`
THEN the appointment SHALL be created
AND the pending SHALL become `accepted`
AND the patient SHALL receive a WhatsApp confirmation

#### Scenario 2.2: Slot unavailable before acceptance

GIVEN a pending booking exists but the slot was booked elsewhere
WHEN a secretary calls `POST /api/pending-bookings/:id/accept`
THEN no duplicate SHALL be created
AND the pending SHALL become `rejected`
AND the secretary SHALL see "Slot no longer available"

### Requirement 3: Alternative Suggestion and Timeout

A secretary MAY suggest an alternative slot with an optional note. Status becomes `suggested`, AI asks the patient. On patient confirmation, system books. On decline or 2h timeout, system auto-rejects and notifies.

#### Scenario 3.1: Suggest alternative → patient confirms

GIVEN a pending booking exists and the secretary picks an alternative slot
WHEN the secretary calls `POST /api/pending-bookings/:id/suggest-alternative` with `slot_start`, `slot_end`, and optional `note`
THEN the pending SHALL become `suggested`
AND the AI SHALL ask the patient about the proposed slot
AND when the patient confirms, the system SHALL create the booking

#### Scenario 3.2: Alternative timeout → auto-reject

GIVEN a pending booking with status `suggested`
WHEN 2 hours pass without patient response
THEN the pending SHALL become `rejected`
AND the secretary SHALL be notified

### Requirement 4: Concurrent Approval Guard

Acceptance MUST use optimistic lock (`WHERE status = 'pending'`). The second secretary receives a message identifying the first.

#### Scenario 4.1: Two secretaries accept simultaneously

GIVEN a pending booking with status `pending`
WHEN two secretaries call accept concurrently
THEN exactly one SHALL succeed and set `accepted_by`
AND the second SHALL receive "Already accepted by [name]"

### Requirement 5: Patient Phone Change Guard

If the patient's WhatsApp phone at approval time differs from the phone at pending creation, the system MUST auto-reject and notify.

#### Scenario 5.1: Patient changed phone → pending rejected

GIVEN a pending created with patient phone `+5411111111`
WHEN a secretary attempts to accept
AND the current phone is now `+5422222222`
THEN the system SHALL reject the pending
AND the secretary SHALL be notified that the patient changed their phone

### Requirement 6: Global Queue Visibility

The queue MUST be visible across all pages as a non-blocking, collapsible panel. The system SHOULD poll every 10 seconds.

#### Scenario 6.1: Queue visible across navigation

GIVEN a secretary is on any page
WHEN a pending booking exists
THEN the secretary SHALL see the queue trigger in a fixed-position element
AND SHALL be able to expand it to see all pending bookings

### Requirement 7: REST Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/pending-bookings` | List active pending bookings |
| POST | `/api/pending-bookings/:id/accept` | Accept and book |
| POST | `/api/pending-bookings/:id/suggest-alternative` | Suggest alternative |
| POST | `/api/pending-bookings/:id/reject` | Reject without booking |

#### Scenario 7.1: List returns active pendings

GIVEN bookings with status `pending` or `suggested`
WHEN a GET request is sent to `/api/pending-bookings`
THEN the response SHALL include all active bookings
AND SHALL NOT include accepted or rejected bookings
