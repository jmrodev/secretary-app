const axios = require('axios');

const sendMessage = async (to, templateName, languageCode = 'es') => {
    try {
        const token = process.env.WHATSAPP_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        if (!token || !phoneId) {
            throw new Error('WHATSAPP_TOKEN, WHATSAPP_PHONE_ID are required in .env');
        }

        const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

        const data = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode
                }
            }
        };

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const broadcastMessage = async (req, res) => {
    const { contacts, templateName } = req.body;

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

    // Process sequentially to be gentle, though Axios can handle parallel. 
    // For large lists, a queue system is better, but this suffices for a simple broadcast.
    for (const contact of contacts) {
        try {
            const response = await sendMessage(contact.phone, templateName);
            results.success.push({ phone: contact.phone, messageId: response.messages[0].id });
        } catch (error) {
            results.failed.push({
                phone: contact.phone,
                error: error.response?.data?.error?.message || error.message
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
    broadcastMessage
};
