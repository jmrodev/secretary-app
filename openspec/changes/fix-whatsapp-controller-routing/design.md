# Design: Dynamic WhatsApp Message Routing

## Technical Approach
This change implements dynamic routing for the `/whatsapp/send` POST endpoint inside the backend application to support both template-based messages (sent via Meta Cloud API) and direct text messages (sent via local Go Bridge) transparently. 

By resolving parameters dynamically from the request body:
1. Normalizes the recipient's phone number (`to` or `phone`).
2. Checks for `templateName` to route to the template message service.
3. Fallbacks to `message` or `text` to route to the direct message service.
4. Performs strict input validation returning `400 Bad Request` if crucial identifiers or payloads are missing.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Dynamic Routing Endpoint** vs **Separate Endpoints** | Keeping a single endpoint prevents breaking existing frontend components (e.g. `useWhatsappChatController.js`) and keeps API surface small, but requires conditional logic inside the controller. | **Dynamic Routing Endpoint**: Implement logical branching in `sendMessage` controller. |
| **Direct message parameters** | Resolving either `message` or `text` parameters ensures compatibility across frontend modules and API clients. | **Permissive payload checking**: Check for `message` or `text` to build the direct payload. |

## Data Flow

```
                   POST /whatsapp/send
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      [templateName present]    [templateName absent]
              │                           │
              ▼                           ▼
     sendTemplateMessage()         sendMessageDirect()
      (Meta Cloud API)             (Go Bridge service)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| [server/controllers/communication/whatsappController.js](file:///home/jmro/Documents/secretary-app/server/controllers/communication/whatsappController.js) | Modify | Update the `sendMessage` function to perform dynamic validation and routing logic. |

## Interfaces / Contracts

### Modified `sendMessage` controller implementation in JavaScript:
```javascript
const sendMessage = async (req, res) => {
    const { to, phone, templateName, languageCode, components, message, text, patientId } = req.body;
    const recipient = to || phone;
    const directMessageText = message || text;

    if (!recipient) {
        return res.status(400).json({ error: 'Missing recipient phone number (to or phone)' });
    }

    try {
        let result;
        if (templateName) {
            result = await whatsappService.sendTemplateMessage(recipient, templateName, languageCode || 'es', components);
        } else if (directMessageText) {
            result = await whatsappService.sendMessageDirect(recipient, directMessageText, patientId);
        } else {
            return res.status(400).json({ error: 'Missing message payload (either templateName or message/text is required)' });
        }
        res.json({ success: true, data: result });
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Controller validation and service routing logic | Write tests invoking `sendMessage` with various request bodies (with templateName, without templateName but with message/text, without phone number) and assert routing calls and status codes. |
| Integration | End-to-end routing with mock services | Use API runner (like Postman or supertest) to POST to `/whatsapp/send` and verify response schema matches. |

## Threat Matrix
`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Migration / Rollout
No migration required.

## Open Questions
- None.
