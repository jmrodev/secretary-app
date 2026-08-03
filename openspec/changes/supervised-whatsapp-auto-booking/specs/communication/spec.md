# Delta for Communication

## ADDED Requirements

### Requirement 3: WhatsApp AI Auto-Booking → Pending Creation

When the AI detects a patient explicitly confirms a specific slot, `_tryAutoBook()` MUST create a `whatsapp_pending_bookings` row with status `pending` instead of calling `bookingService.createAppointment()`. The AI response MUST inform the patient their request is pending secretary approval.

#### Scenario 3.1: Patient confirms slot → pending created

GIVEN the AI has identified a free slot the patient confirmed
WHEN `_tryAutoBook()` executes
THEN a pending booking SHALL be created with status `pending`
AND `bookingService.createAppointment()` SHALL NOT be called
AND the patient SHALL receive a message that their booking awaits secretary approval

### Requirement 4: AI Re-Detection Guard

The AI context (`_buildContext()`) MUST include an active pending booking flag for the patient's conversation. When a pending booking exists, the AI MUST NOT re-detect booking intent or call `_tryAutoBook()`.

#### Scenario 4.1: Patient messages during pending → no re-detection

GIVEN a patient has an active pending booking
WHEN the patient sends any WhatsApp message
THEN the AI context SHALL include the pending status
AND the AI SHALL NOT trigger `_tryAutoBook()`
AND the AI SHALL respond using the pending-state template

### Requirement 5: Configurable Pending-State AI Response

The WhatsApp AI configuration SHALL include a `pending_response_template` field. The secretary MAY edit this field from the WhatsApp AI config page. The system SHALL provide a default polite "please wait" message. When a patient messages during an active pending, the AI MUST respond with this template.

#### Scenario 5.1: Secretary updates the pending template

GIVEN the WhatsApp AI config page is open
WHEN the secretary modifies the `pending_response_template` field and saves
THEN the change SHALL be persisted
AND subsequent AI responses during pending state SHALL use the new template

#### Scenario 5.2: Default template used until configured

GIVEN no `pending_response_template` has been configured
WHEN the AI needs to respond during pending state
THEN the AI SHALL use the system-provided default message

## RETENTION STATEMENT

Requirements 1 and 2 from `openspec/specs/communication.md` (WhatsApp Session Invalidation, AI Suggestion Routing) remain unchanged and are NOT modified by this delta.
