# Exploration: WhatsApp Controller Routing & Message Sending Failures

## 1. Problem Analysis

### Why Frontend Message Sending Fails
The chat interface in the frontend (specifically inside [useWhatsappChatController.js](file:///home/jmro/Documents/secretary-app/client/src/features/patients/hooks/useWhatsappChatController.js#L112-L116)) sends a POST request to `/whatsapp/send` with the following request body format:
```json
{
  "patientId": "123",
  "phone": "54911...",
  "message": "Hello from the chat"
}
```

However, the backend endpoint `/whatsapp/send` routes to `sendMessage` in [whatsappController.js](file:///home/jmro/Documents/secretary-app/server/controllers/communication/whatsappController.js#L13-L20), which is implemented as follows:
```javascript
const sendMessage = async (req, res) => {
    const { to, templateName, languageCode, components } = req.body;
    if (!to || !templateName) return res.status(400).json({ error: 'Missing required parameters' });
    try {
        const result = await whatsappService.sendTemplateMessage(to, templateName, languageCode, components);
        res.json({ success: true, data: result });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
```

This causes two major issues:
1. **Missing Parameter `to`**: The frontend sends the phone number in the field `phone`, while the backend expects it in `to`.
2. **Missing Parameter `templateName`**: The chat controller is sending a direct text message (`message` parameter) rather than a template message. The backend strictly requires `templateName` and rejects the request with a `400 Bad Request` ("Missing required parameters") if it is absent.

---

## 2. Proposed Design: Dynamic `/whatsapp/send` Endpoint

To handle both template-based messages and direct text messages dynamically on the same endpoint, we propose updating `sendMessage` in `whatsappController.js` to look for both formats.

### Normalization Logic
1. **Recipient Phone (`to`)**: Extract the target phone number from either `req.body.to` or `req.body.phone`.
2. **Template Message Routing**: If `templateName` is present, invoke `whatsappService.sendTemplateMessage(to, templateName, languageCode, components)`.
3. **Direct Message Routing**: If `templateName` is absent but `message` (or `text`) is present, invoke `whatsappService.sendMessageDirect(to, message, patientId)`.
4. **Validation**: If neither `templateName` nor `message` is provided, or if the recipient phone cannot be resolved, return a `400 Bad Request` with an appropriate error message.

### Proposed Code for `sendMessage`:
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
            // Route to Meta Cloud API Template Service
            result = await whatsappService.sendTemplateMessage(recipient, templateName, languageCode, components);
        } else if (directMessageText) {
            // Route to local Go Bridge direct messaging service
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

---

## 3. Pros and Cons of Dynamic Endpoint vs Dedicated Endpoints

### Pros:
- **API Simplification**: The frontend can call a single, unified `/whatsapp/send` endpoint for all outbound message delivery without needing to worry about the underlying provider or mechanism (Meta vs Go bridge).
- **Graceful Backwards Compatibility**: Keeps the existing routing setup intact without breaking other parts of the application that might already use `/whatsapp/send` for templates or expect specific routing behavior.

### Cons:
- **Slightly more complex controller logic**: The controller has to do minor branching logic to parse parameter types, but it is very straightforward and well within standard backend controller responsibilities.
