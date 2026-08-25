## Technical Approach

Migrate hardcoded automated WhatsApp messages out of backend services into the `system_settings` table. We will introduce new setting keys for debt reminders, accepting pending bookings, and suggesting alternative slots. For existing reminder and confirmation templates (which partially use `appointment_reminder_template`), we will standardize them to the new `whatsapp_template_*` keys as specified in the proposal.

## Architecture Decisions

### Decision: Standardizing Template Keys

**Choice**: Use `whatsapp_template_reminder`, `whatsapp_template_confirmation`, `whatsapp_template_debt`, `whatsapp_template_accept`, and `whatsapp_template_alternative` in `system_settings`.
**Alternatives considered**: Keep existing `appointment_reminder_template` and just add the missing ones.
**Rationale**: The proposal explicitly requests the `whatsapp_template_*` naming convention to keep WhatsApp-specific templates grouped together in the database and configuration dictionary.

### Decision: Fallback Behavior

**Choice**: Inject hardcoded default strings in the backend services if the `system_settings` keys are missing or empty.
**Alternatives considered**: Fail the message send operation if the template is missing.
**Rationale**: Failing to send would break critical business workflows (like appointment confirmations). Providing a graceful fallback ensures continuity of service while a setting is misconfigured or missing.

## Data Flow

    [Frontend Config] ──(Updates Settings)──→ [System Settings DB]
                                                   │
    [Backend Triggers] ─(Fetch Template)───────────┘
         │
    [Variable Interpolation]
         │
    [WhatsApp Bridge / API] ──→ [Patient WhatsApp]

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `server/scripts/migrations/27_whatsapp_message_templates.sql` | Create | Insert default template strings for the 5 new keys into `system_settings` |
| `server/services/communication/whatsappService.js` | Modify | Update `sendAutomatedReminders`, `sendConfirmationMessage`, and `sendDebtReminder` to use `whatsapp_template_*` keys with hardcoded fallbacks |
| `server/controllers/communication/whatsappController.js` | Modify | Update `acceptPending` and `suggestAlternative` to fetch templates via `systemSettingsRepository`, interpolate variables, and fall back to hardcoded strings |
| `client/src/features/config/components/sections/CommunicationSettings.jsx` | Modify | Add `MessageTemplateEditor` components for debt, accept, and alternative templates. Update keys for reminder/confirmation to use `whatsapp_template_*` |

## Interfaces / Contracts

No new interfaces; we will reuse the existing `MessageTemplateEditor` component in the frontend and `systemSettingsRepository` in the backend.

Variables supported per template:
- Reminder/Confirmation: `{patient_name}`, `{date}`, `{time}`, `{doctor_name}`, `{appointment_location}`
- Debt: `{patient_name}`, `{debt_amount}`
- Accept Pending: `{patient_name}`, `{date}`, `{time}`, `{doctor_name}`
- Alternative Pending: `{patient_name}`, `{date}`, `{time}`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Variable interpolation | Test backend string replace logic with various inputs |
| Integration | Settings fallback | Verify backend uses hardcoded string when setting is deleted |
| E2E | Template update | Update a template in Config UI, trigger a pending accept, verify sent message matches new template |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No complex migration required. The new SQL migration script will seed the default templates so that there is no behavior change upon deployment. We will deprecate the old `appointment_reminder_template` keys.

## Open Questions

- [ ] Should we migrate existing `appointment_reminder_template` values to `whatsapp_template_reminder` in the database migration, or just seed the defaults and let admins reconfigure? (Assuming seeding defaults for now).
