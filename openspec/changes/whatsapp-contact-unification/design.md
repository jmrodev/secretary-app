# Design: WhatsApp Contact Tab Unification

## Technical Approach

Introduce a `window` CustomEvent bus (`whatsapp:open-chat`) to decouple the
appointment modal from `GlobalWhatsappMessenger` without prop-drilling or new
context. Separate the Confirmation flow to use the existing `WhatsAppModal`
infrastructure already wired in `AppointmentsPage`. No new backend routes.

## Architecture Decisions

### Decision: CustomEvent vs. React Context for chat trigger

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `window` CustomEvent | Zero coupling, works across any tree depth | ✅ Chosen |
| React Context | Requires wrapping `GlobalWhatsappMessenger` provider higher in tree | ❌ Rejected — more invasive |
| Lifting state to `App` | Props through 5+ layers | ❌ Rejected — prop-drilling |

**Rationale**: `GlobalWhatsappMessenger` is always mounted in `App`. A CustomEvent
requires no structural change to the component tree.

### Decision: Confirmation via existing WhatsAppModal (not new component)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Reuse `WhatsAppModal` | Already wired in `AppointmentsPage`, has Auto Send + Manual | ✅ Chosen |
| Inline confirmation in AdminPanel | Requires new UI state in panel | ❌ Rejected |

**Rationale**: `WhatsAppModal` already handles phone normalization, bridge send, and
manual fallback. No duplication needed.

## Data Flow

```
[AppointmentAdminPanel]
  Chat btn click
    → onWhatsApp(appt, 'chat')
      → useWhatsAppUniversal: type==='chat'
        → GET /whatsapp/status (quick check)
          → connected: window.dispatchEvent('whatsapp:open-chat', { phone, patientId, patientName })
                         → GlobalWhatsappMessenger listener → setIsOpen(true) + setActiveChat
          → offline:   window.open('https://wa.me/{normalizedPhone}', '_blank')

  Confirmation btn click
    → onWhatsAppConfirmation(appt)          ← new prop
      → useAppointmentsPageController: handleWhatsAppConfirmation(appt)
        → pre-renders confirmation_template (same replace logic as useWhatsAppUniversal)
        → setWhatsappModal({ open: true, phone, message: renderedTemplate })
          → WhatsAppModal opens (already exists, already wired)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/appointments/hooks/useWhatsAppUniversal.js` | Modify | Add `'chat'` branch: check bridge status, dispatch CustomEvent or open wa.me |
| `src/components/organisms/GlobalWhatsappMessenger.jsx` | Modify | Add `useEffect` with `window.addEventListener('whatsapp:open-chat', handler)` + cleanup |
| `src/features/appointments/components/sections/AppointmentAdminPanel.jsx` | Modify | Add `onWhatsAppConfirmation` prop; change Confirmation button to call it |
| `src/features/appointments/components/modals/AppointmentActionModal.jsx` | Modify | Accept + forward `onWhatsAppConfirmation` prop |
| `src/features/appointments/components/sections/AppointmentsModals.jsx` | Modify | Pass `handlers.handleWhatsAppConfirmation` as `onWhatsAppConfirmation` |
| `src/features/appointments/hooks/useAppointmentsPageController.js` | Modify | Add `handleWhatsAppConfirmation(appt)` — pre-renders template + calls `setWhatsappModal` |

## Interfaces / Contracts

```js
// CustomEvent payload
window.dispatchEvent(new CustomEvent('whatsapp:open-chat', {
  detail: { phone: string, patientId: number|null, patientName: string }
}));

// New prop on AppointmentAdminPanel
onWhatsAppConfirmation: (appt: AppointmentObject) => void

// New handler in useAppointmentsPageController
handleWhatsAppConfirmation: (appt: AppointmentObject) => void
// → setWhatsappModal({ open: true, phone: normalized, message: renderedTemplate })
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useWhatsAppUniversal` chat branch: dispatches event when connected, opens wa.me when offline | Jest + mock `api.get('/whatsapp/status')` |
| Unit | `GlobalWhatsappMessenger`: listener registers on mount, cleans up on unmount | Jest + `dispatchEvent` |
| Manual | Confirmation button opens `WhatsAppModal` with template pre-filled | Visual verification in dev |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file
classification, or process-integration boundary in this change.

## Migration / Rollout

No migration required. All changes are additive. `useWhatsappModal` state is already
initialized to `{ open: false, phone: '', message: '' }` in `useAppointmentBooking`.

## Open Questions

- [ ] Should the chat fallback (wa.me) show a toast explaining why the bridge is offline?
