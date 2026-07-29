# Delta for Communication

## ADDED Requirements

### Requirement: Dynamic WhatsApp Message Routing

The `/whatsapp/send` endpoint MUST dynamically support both template-based messages and direct text messages.

1. The endpoint MUST resolve the recipient's phone number from either the `to` or `phone` parameter.
2. If `templateName` is present, the endpoint MUST route the request to the template messaging service.
3. If `templateName` is absent and either `message` or `text` is present, the endpoint MUST route the request to the direct messaging service.
4. If no recipient phone number is resolved, the endpoint MUST return a `400 Bad Request` status.
5. If neither `templateName` nor direct text message content (`message` or `text`) is resolved, the endpoint MUST return a `400 Bad Request` status.

#### Scenario: Routing template message with 'to' parameter
- GIVEN the backend is running
- WHEN a POST request is sent to `/whatsapp/send` with `to` and `templateName` parameters
- THEN the endpoint MUST invoke the template message service using the resolved recipient and template details
- AND return a success response

#### Scenario: Routing direct message with 'phone' and 'message' parameters
- GIVEN the backend is running
- WHEN a POST request is sent to `/whatsapp/send` with `phone` and `message` parameters and no `templateName`
- THEN the endpoint MUST invoke the direct message service using the resolved recipient and message text
- AND return a success response

#### Scenario: Validation failure for missing recipient
- GIVEN the backend is running
- WHEN a POST request is sent to `/whatsapp/send` without `to` or `phone` parameters
- THEN the endpoint MUST return a `400 Bad Request` response with an error message indicating missing recipient phone number

#### Scenario: Validation failure for missing payload
- GIVEN the backend is running
- WHEN a POST request is sent to `/whatsapp/send` with a recipient but without `templateName`, `message`, or `text`
- THEN the endpoint MUST return a `400 Bad Request` response with an error message indicating missing message payload
