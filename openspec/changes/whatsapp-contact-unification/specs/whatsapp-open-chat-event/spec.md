# whatsapp-open-chat-event Specification

## Purpose

Defines a CustomEvent-based mechanism that allows any component in the app to
open the `GlobalWhatsappMessenger` panel with a specific patient conversation
preselected, without direct prop-drilling or context coupling.

## Requirements

### Requirement: Event Dispatch Interface

The system MUST support dispatching a `whatsapp:open-chat` CustomEvent on
`window` with a `detail` payload of `{ phone, patientId, patientName }` to
trigger opening the messenger with a patient preselected.

#### Scenario: Chat opened with connected bridge

- GIVEN the bridge status is `connected`
- WHEN a `whatsapp:open-chat` event is dispatched with a valid phone number
- THEN `GlobalWhatsappMessenger` panel opens
- AND the patient's conversation is set as the active chat
- AND recent conversations are fetched

#### Scenario: Chat opened with offline bridge

- GIVEN the bridge status is `offline` or `disconnected`
- WHEN a `whatsapp:open-chat` event is dispatched
- THEN the dispatcher falls back to opening `https://wa.me/{normalizedPhone}` in a new tab
- AND `GlobalWhatsappMessenger` is NOT opened

#### Scenario: Event dispatched with missing phone

- GIVEN a `whatsapp:open-chat` event is dispatched with no phone in detail
- WHEN `GlobalWhatsappMessenger` receives the event
- THEN the event is ignored and no state change occurs

### Requirement: Event Listener Lifecycle

`GlobalWhatsappMessenger` MUST register the `whatsapp:open-chat` listener on
`window` when mounted and MUST remove it when unmounted.

#### Scenario: Listener registered on mount

- GIVEN `GlobalWhatsappMessenger` is mounted in the React tree
- WHEN the component initializes
- THEN it adds a `whatsapp:open-chat` event listener on `window`

#### Scenario: Listener removed on unmount

- GIVEN `GlobalWhatsappMessenger` is mounted and listening
- WHEN the component unmounts
- THEN it removes the `whatsapp:open-chat` listener from `window`
