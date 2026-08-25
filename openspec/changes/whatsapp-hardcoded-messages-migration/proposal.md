## Intent

Migrate hardcoded WhatsApp message templates (e.g., `sendAutomatedReminders`, `sendConfirmationMessage`, `sendDebtReminder`, `acceptPending`, `suggestAlternative`) out of the backend code and into the database (`system_settings`). Expose these settings in the frontend's Communications configuration tab so administrators can customize message texts without code changes.

## Scope

### In Scope
- Extract `sendAutomatedReminders`, `sendConfirmationMessage`, and `sendDebtReminder` text templates from `whatsappService.js` to `system_settings`.
- Extract `acceptPending` and `suggestAlternative` text templates from `whatsappController.js` to `system_settings`.
- Update backend services to fetch and interpolate variables dynamically.
- Add UI inputs for these new templates in the frontend Communications tab (`/config?tab=communications`).
- Run a DB migration/seed for initial default templates in `system_settings`.

### Out of Scope
- Modifying the underlying WhatsApp bridge behavior.
- Adding completely new types of notifications.
- Changing AI suggestion features.

## Capabilities

### New Capabilities
- `whatsapp-message-templates`: Manage dynamic WhatsApp message templates through configuration UI rather than code.

### Modified Capabilities
- `communication.md`: WhatsApp message generation rules change to use configuration-driven templates instead of hardcoded strings.
- `whatsapp-pending-booking`: The text sent when accepting pending bookings or suggesting alternatives must use the configurable templates.

## Approach

1. Create a database migration/seed to insert the default templates into `system_settings` (e.g., `whatsapp_template_reminder`, `whatsapp_template_confirmation`, `whatsapp_template_debt`, `whatsapp_template_accept`, `whatsapp_template_alternative`).
2. Update the frontend Config UI (communications tab) to load, display, and update these new setting keys.
3. Update `whatsappService.js` and `whatsappController.js` to fetch the template strings from `system_settings`, replace placeholders (e.g., `{name}`, `{date}`, `{time}`), and send the dynamically generated text.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `server/services/communication/whatsappService.js` | Modified | Use dynamic templates instead of hardcoded strings |
| `server/controllers/communication/whatsappController.js` | Modified | Use dynamic templates for booking operations |
| `frontend/src/views/Config.vue` (or similar) | Modified | Add inputs for new templates in communications tab |
| DB Migrations / Seeders | Modified | Add initial values for the new setting keys |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing/Invalid variables | Medium | Implement robust placeholder substitution logic. Inform users on UI which variables are available (`{name}`, `{date}`, etc.). |
| Service interruption | Low | Seed initial values exactly as the current hardcoded ones before switching backend logic. |

## Rollback Plan

Revert the PR containing frontend UI changes and backend code modifications. Hardcoded messages will immediately be active again.

## Dependencies

- None

## Success Criteria

- [ ] All five identified message types are read from `system_settings`.
- [ ] Changing texts via the frontend Communications tab immediately updates sent messages.
- [ ] No hardcoded message templates for these operations remain in the affected backend files.
