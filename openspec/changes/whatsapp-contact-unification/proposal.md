# Proposal: WhatsApp Contact Tab Unification

## Intent

The "Contact" tab in `AppointmentAdminPanel` exposes three WhatsApp buttons, but two of them ("WhatsApp Chat" and "Enviar Confirmación") execute identical logic — both fall into the same `else` branch in `useWhatsAppUniversal`, using the `confirmation_template` and attempting `POST /whatsapp/send-direct`. This creates a confusing, redundant UI and wastes the existing `GlobalWhatsappMessenger` bridge infrastructure that already supports opening patient conversations internally.

## Scope

### In Scope
- Differentiate the "Chat" button: open `GlobalWhatsappMessenger` with the patient preselected (bridge connected) or fall back to `wa.me/{phone}` (bridge offline)
- Differentiate the "Confirmation" button: open `WhatsAppModal` with the `confirmation_template` preloaded and editable, letting the user choose Auto Send or Manual
- Expose an `openChat(patient)` mechanism in `GlobalWhatsappMessenger` via a `CustomEvent` (`whatsapp:open-chat`)
- Keep "Reminder" behavior completely unchanged
- Rename the "WhatsApp Chat" button label to make its purpose clear

### Out of Scope
- New backend routes or bridge endpoints
- Changes to the reminder flow (Meta API + send-direct)
- Refactoring `GlobalWhatsappMessenger` state management
- Mobile-specific behavior changes

## Capabilities

### New Capabilities
- `whatsapp-open-chat-event`: CustomEvent-based mechanism to open `GlobalWhatsappMessenger` with a specific patient preselected from any part of the app

### Modified Capabilities
- `whatsapp-contact-tab`: The contact tab in `AppointmentAdminPanel` now has three distinct behaviors instead of two identical ones

## Approach

1. **CustomEvent bus** — `GlobalWhatsappMessenger` listens for `window` event `whatsapp:open-chat` with `{ phone, patientId, patientName }`. On receive: sets `isOpen=true`, `activeChat` to the patient, fetches conversations.
2. **`useWhatsAppUniversal` — add `'chat'` branch** — normalizes phone, checks bridge status via `GET /whatsapp/status` (already called by `GlobalWhatsappMessenger`), dispatches `whatsapp:open-chat` event. If bridge is offline/unreachable, falls back to `window.open('https://wa.me/{phone}', '_blank')`.
3. **`AppointmentAdminPanel` — Confirmation button** — instead of calling `handleWhatsAppUniversal(appt, 'confirmation')`, calls `onWhatsAppConfirmation(appt)` which populates and opens `WhatsAppModal` with the rendered confirmation template.
4. **`useAppointmentsPageController`** — adds `handleWhatsAppConfirmation` handler that pre-renders the template and calls `setWhatsappModal({ open: true, phone, message })`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/appointments/hooks/useWhatsAppUniversal.js` | Modified | Add `'chat'` branch dispatching CustomEvent |
| `src/features/appointments/components/sections/AppointmentAdminPanel.jsx` | Modified | New `onWhatsAppConfirmation` prop; chat button label update |
| `src/components/organisms/GlobalWhatsappMessenger.jsx` | Modified | Listen for `whatsapp:open-chat` CustomEvent |
| `src/features/appointments/components/sections/AppointmentsModals.jsx` | Modified | Pass `onWhatsAppConfirmation` to `AppointmentActionModal` |
| `src/features/appointments/components/modals/AppointmentActionModal.jsx` | Modified | Accept and forward `onWhatsAppConfirmation` prop |
| `src/features/appointments/hooks/useAppointmentsPageController.js` | Modified | Add `handleWhatsAppConfirmation` handler |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CustomEvent not received if GlobalWhatsappMessenger unmounted | Low | Component is always mounted in App.jsx |
| Bridge status stale at event dispatch time | Med | Use optimistic open; messenger re-checks status on mount |
| WhatsAppModal message prop renders wrong template | Low | Pre-render template in controller before opening modal |

## Rollback Plan

All changes are additive props and a new event listener. Revert: remove `whatsapp:open-chat` listener from `GlobalWhatsappMessenger`, restore `onWhatsApp` call for confirmation in `AppointmentAdminPanel`, remove `handleWhatsAppConfirmation` from controller. No DB or backend changes — pure frontend rollback.

## Dependencies

- `GlobalWhatsappMessenger` must remain mounted at App level (already is)
- `WhatsAppModal` already exists and accepts `phone` + `message` + `onMessageChange` props (already wired in `AppointmentsPage`)

## Success Criteria

- [ ] Clicking "WhatsApp" (chat) opens `GlobalWhatsappMessenger` with the patient's conversation visible when bridge is connected
- [ ] Clicking "WhatsApp" (chat) opens `wa.me/{phone}` in new tab when bridge is offline
- [ ] Clicking "Confirmación" opens `WhatsAppModal` with the confirmation template preloaded and editable
- [ ] "Recordatorio" behavior is unchanged
- [ ] No duplicate/redundant button behavior in the Contact tab
