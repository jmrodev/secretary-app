## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

Not needed for low-risk changes.

## Phase 1: Database Migration

- [x] 1.1 Create migration script `server/scripts/migrations/27_whatsapp_message_templates.sql` to insert default templates for `whatsapp_template_reminder`, `whatsapp_template_confirmation`, `whatsapp_template_debt`, `whatsapp_template_accept`, and `whatsapp_template_alternative` into `system_settings`, including moderate emoji usage.

## Phase 2: Backend Implementation

- [x] 2.1 Write failing (RED) unit test verifying that `whatsappService.js` and `whatsappController.js` throw an error when template strings are missing or empty in `system_settings`.
- [x] 2.2 Update `server/services/communication/whatsappService.js` (`sendAutomatedReminders`, `sendConfirmationMessage`, `sendDebtReminder`) to fetch templates from `system_settings` and throw an error if empty/missing (no fallbacks allowed).
- [x] 2.3 Update `server/controllers/communication/whatsappController.js` (`acceptPending`, `suggestAlternative`) to fetch templates from `system_settings` and throw an error if empty/missing (no fallbacks allowed).

## Phase 3: Frontend Implementation

- [x] 3.1 Update `client/src/features/config/components/sections/CommunicationSettings.jsx` to display inputs for the 5 `whatsapp_template_*` keys, allowing adaptation or discarding of old values.
- [x] 3.2 Implement validation rule in `CommunicationSettings.jsx` requiring at least 20 real characters (non-whitespace) for each template before saving.

## Phase 4: Testing / Verification

- [x] 4.1 Update tests to ensure variable interpolation works correctly for all 5 template types.
- [x] 4.2 Verify E2E behavior when a user modifies a template in the Communications tab and triggers a message.
