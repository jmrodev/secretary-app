## MODIFIED Requirements

### Requirement: Accept Flow and Slot-Taken Guard

On acceptance, the system MUST attempt `bookingService.createAppointment()`. On success, status becomes `accepted` with `accepted_by`, and the patient confirmation message MUST be generated using the configured `whatsapp_template_accept` template. On failure (slot taken), status becomes `rejected` and the secretary is notified.
(Previously: On acceptance, the system MUST attempt bookingService.createAppointment(). On success, status becomes accepted with accepted_by. On failure (slot taken), status becomes rejected and the secretary is notified.)

#### Scenario: Secretary accepts → appointment created

- GIVEN a pending booking exists with an available slot
- WHEN a secretary calls `POST /api/pending-bookings/:id/accept`
- THEN the appointment SHALL be created
- AND the pending SHALL become `accepted`
- AND the patient SHALL receive a WhatsApp confirmation generated from `whatsapp_template_accept`

#### Scenario: Slot unavailable before acceptance

- GIVEN a pending booking exists but the slot was booked elsewhere
- WHEN a secretary calls `POST /api/pending-bookings/:id/accept`
- THEN no duplicate SHALL be created
- AND the pending SHALL become `rejected`
- AND the secretary SHALL see "Slot no longer available"

### Requirement: Alternative Suggestion and Timeout

A secretary MAY suggest an alternative slot with an optional note. Status becomes `suggested`, AI asks the patient using the configured `whatsapp_template_alternative` template. On patient confirmation, system books. On decline or 2h timeout, system auto-rejects and notifies.
(Previously: A secretary MAY suggest an alternative slot with an optional note. Status becomes suggested, AI asks the patient. On patient confirmation, system books. On decline or 2h timeout, system auto-rejects and notifies.)

#### Scenario: Suggest alternative → patient confirms

- GIVEN a pending booking exists and the secretary picks an alternative slot
- WHEN the secretary calls `POST /api/pending-bookings/:id/suggest-alternative` with `slot_start`, `slot_end`, and optional `note`
- THEN the pending SHALL become `suggested`
- AND the AI SHALL ask the patient about the proposed slot using the text from `whatsapp_template_alternative`
- AND when the patient confirms, the system SHALL create the booking

#### Scenario: Alternative timeout → auto-reject

- GIVEN a pending booking with status `suggested`
- WHEN 2 hours pass without patient response
- THEN the pending SHALL become `rejected`
- AND the secretary SHALL be notified
