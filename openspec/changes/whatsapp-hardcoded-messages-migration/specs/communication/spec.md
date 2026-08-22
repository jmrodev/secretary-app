## ADDED Requirements

### Requirement: Configuration-Driven Automated Messages

The system MUST fetch automated message templates (e.g., reminders, confirmations, debt notices) from `system_settings` rather than using hardcoded strings in backend services.

#### Scenario: Sending an automated reminder
- GIVEN the system triggers an automated reminder
- WHEN `whatsappService` generates the message text
- THEN it MUST fetch the `whatsapp_template_reminder` setting
- AND interpolate placeholders with actual appointment data
- AND send the resulting customized text

#### Scenario: Missing configuration key
- GIVEN the `system_settings` does not contain a value for `whatsapp_template_confirmation`
- WHEN the system attempts to send a confirmation
- THEN it MUST throw an error
- AND abort sending the message
