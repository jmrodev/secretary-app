const whatsappService = require('../services/whatsappService');

/**
 * Send a templated message (Generic Endpoint)
 */
const sendMessage = async (req, res) => {
    const { to, templateName, languageCode, components } = req.body;

    if (!to || !templateName) {
        return res.status(400).json({ error: 'Missing required parameters (to, templateName)' });
    }

    try {
        const result = await whatsappService.sendTemplateMessage(to, templateName, languageCode, components);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Test the connection credentials
 */
const testConnection = async (req, res) => {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Target phone number (to) is required for testing.' });

    try {
        const result = await whatsappService.sendTestMessage(to);
        res.json({ success: true, message: 'Test message sent', data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Broadcast to multiple contacts (Sequential)
 */
const broadcastMessage = async (req, res) => {
    const { contacts, templateName, languageCode, components } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty contacts list' });
    }

    if (!templateName) {
        return res.status(400).json({ error: 'Template name is required' });
    }

    const results = {
        success: [],
        failed: []
    };

    const promises = contacts.map(async (contact) => {
        try {
            // If components need to be dynamic per user, this logic needs to be smarter.
            // For now, assuming static components for broadcast or simple templates.
            const response = await whatsappService.sendTemplateMessage(contact.phone, templateName, languageCode, components);
            return { success: true, phone: contact.phone, messageId: response.messages?.[0]?.id };
        } catch (error) {
            return { success: false, phone: contact.phone, error: error.message };
        }
    });

    const settledResults = await Promise.all(promises);

    for (const result of settledResults) {
        if (result.success) {
            results.success.push({ phone: result.phone, messageId: result.messageId });
        } else {
            results.failed.push({ phone: result.phone, error: result.error });
        }
    }

    res.json({
        message: 'Broadcast processing complete',
        results
    });
};

/**
 * Send a direct message using the local bridge
 */
const sendDirectMessage = async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Missing required parameters (to, message)' });
    }

    try {
        const result = await whatsappService.sendMessageDirect(to, message);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    sendMessage,
    broadcastMessage,
    testConnection,
    sendDirectMessage
};
