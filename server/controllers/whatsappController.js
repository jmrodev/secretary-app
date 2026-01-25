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

    for (const contact of contacts) {
        try {
            // If components need to be dynamic per user, this logic needs to be smarter.
            // For now, assuming static components for broadcast or simple templates.
            const response = await whatsappService.sendTemplateMessage(contact.phone, templateName, languageCode, components);
            results.success.push({ phone: contact.phone, messageId: response.messages?.[0]?.id });
        } catch (error) {
            results.failed.push({
                phone: contact.phone,
                error: error.message
            });
        }
    }

    res.json({
        message: 'Broadcast processing complete',
        results
    });
};

module.exports = {
    sendMessage,
    broadcastMessage,
    testConnection
};
