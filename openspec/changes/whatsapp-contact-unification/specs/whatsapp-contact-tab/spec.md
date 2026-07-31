# Delta for whatsapp-contact-tab

## MODIFIED Requirements

### Requirement: WhatsApp Contact Tab Actions

The Contact tab in `AppointmentAdminPanel` MUST expose three distinct WhatsApp
actions with different behaviors:

1. **Chat** — opens the internal messenger panel with the patient preselected
   when the bridge is connected, or opens `wa.me/{phone}` in a new tab when offline.
2. **Reminder** — sends the reminder template via bridge auto-send or manual fallback (unchanged).
3. **Confirmation** — opens `WhatsAppModal` with the rendered `confirmation_template`
   preloaded and editable; user chooses Auto Send (bridge) or Manual (copy + open WA).

(Previously: "Chat" and "Confirmation" both called `handleWhatsAppUniversal` with
different `type` strings but fell into the same else-branch, producing identical behavior.)

#### Scenario: User clicks Chat — bridge connected

- GIVEN the appointment has a patient phone number
- AND the bridge status is `connected`
- WHEN the user clicks the "WhatsApp" (chat) button
- THEN the `GlobalWhatsappMessenger` panel opens with the patient's conversation active

#### Scenario: User clicks Chat — bridge offline

- GIVEN the appointment has a patient phone number
- AND the bridge status is `offline` or `disconnected`
- WHEN the user clicks the "WhatsApp" (chat) button
- THEN `https://wa.me/{normalizedPhone}` opens in a new browser tab

#### Scenario: User clicks Confirmation

- GIVEN the appointment has a patient phone number
- WHEN the user clicks "Confirmación"
- THEN `WhatsAppModal` opens
- AND the textarea is pre-populated with the rendered `confirmation_template` for the appointment
- AND the user can edit the message before sending

#### Scenario: User clicks Reminder (unchanged)

- GIVEN the appointment has a patient phone number
- AND the appointment status is not `completed`
- WHEN the user clicks "Recordatorio"
- THEN the reminder template is sent via bridge (if connected) or copied + WA opened (fallback)

## REMOVED Requirements

### Requirement: Identical Chat/Confirmation behavior

(Reason: "Chat" and "Confirmation" no longer share the same code path. The `else`
branch in `useWhatsAppUniversal` that handled both is replaced by distinct branches.)
(Migration: `type='chat'` dispatches the CustomEvent; `type='confirmation'` is replaced
by a separate `onWhatsAppConfirmation` prop that opens `WhatsAppModal`.)
