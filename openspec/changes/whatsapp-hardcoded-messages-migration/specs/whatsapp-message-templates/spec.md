</Delta for whatsapp-message-templates>
<whatsapp-message-templates Specification>
## Purpose

Manage dynamic WhatsApp message templates through configuration UI, enabling administrators to customize automated message texts without modifying code.

## Requirements

### Requirement: Configuration-Driven Message Templates

The system MUST fetch message templates from `system_settings` instead of hardcoding strings in the backend for automated WhatsApp messages. Supported templates MUST include reminder, confirmation, debt, accept pending, and suggest alternative messages.

#### Scenario: Send automated reminder
- GIVEN the `whatsapp_template_reminder` setting contains a valid string with placeholders
- WHEN the system sends an automated reminder for an appointment
- THEN the system SHALL fetch the template from `system_settings`
- AND SHALL dynamically replace placeholders (e.g., `{name}`, `{date}`, `{time}`) before sending

#### Scenario: Missing configuration key
- GIVEN the `system_settings` lacks a specific template key (e.g. `whatsapp_template_confirmation`)
- WHEN the system attempts to send that message
- THEN the system SHALL throw an error
- AND abort sending the message

### Requirement: Configurable Variables Interpolation

The system MUST parse specific variables (e.g., `{name}`, `{date}`, `{time}`) from the template and replace them with contextual data.

#### Scenario: Proper variable substitution
- GIVEN a template string "Hello {name}, your appointment is on {date} at {time}"
- WHEN an appointment confirmation is triggered for "John" on "2026-09-01" at "14:00"
- THEN the outgoing message SHALL be exactly "Hello John, your appointment is on 2026-09-01 at 14:00"

### Requirement: Frontend Management of Templates

The system MUST expose inputs for all message template settings in the Communications tab of the Configuration UI.

#### Scenario: Admin updates template
- GIVEN an administrator navigates to `/config?tab=communications`
- WHEN they update the "Debt Reminder" template text and save
- THEN the new text SHALL be saved to `system_settings` under the appropriate key
- AND all subsequent debt reminder messages SHALL use the updated text
</whatsapp-message-templates Specification>
