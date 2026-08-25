/**
 * Validation middlewares for WhatsApp routes.
 * Keeps inline controller checks but satisfies the "middlewares de validación específicos" rule.
 */

const validateSendMessage = (req, res, next) => {
    const { to, templateName } = req.body;
    if (!to || !templateName) {
        return res.status(400).json({ error: 'Missing required parameters: to, templateName' });
    }
    next();
};

const validateSendDirect = (req, res, next) => {
    const { to, message } = req.body;
    if (!to || !message) {
        return res.status(400).json({ error: 'Missing to or message' });
    }
    next();
};

const validateBroadcast = (req, res, next) => {
    const { contacts, templateName } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0 || !templateName) {
        return res.status(400).json({ error: 'Invalid parameters: contacts array and templateName required' });
    }
    next();
};

const validateSuggestAlternative = (req, res, next) => {
    const { alternative_slot_iso } = req.body;
    if (!alternative_slot_iso) {
        return res.status(400).json({ success: false, error: 'alternative_slot_iso is required' });
    }
    next();
};

const validatePendingId = (req, res, next) => {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid pending booking id' });
    }
    next();
};

const validateHistory = (req, res, next) => {
    const { patientId, phone } = req.body;
    if (!patientId && !phone) {
        return res.status(400).json({ error: 'patientId or phone is required' });
    }
    next();
};

const validateDeleteConversation = (req, res, next) => {
    const { patientId, phone } = req.body;
    if (!patientId && !phone) {
        return res.status(400).json({ error: 'patientId or phone is required' });
    }
    next();
};

const validateTestConnection = (req, res, next) => {
    const { to } = req.body;
    if (!to) {
        return res.status(400).json({ error: 'Target phone number is required.' });
    }
    next();
};

const validateBroadcastDirect = (req, res, next) => {
    const { message } = req.body;
    if (!message?.trim()) {
        return res.status(400).json({ error: 'Message is required' });
    }
    next();
};

const validateBroadcastPreview = (req, res, next) => {
    const { filter } = req.body;
    if (filter && !['last_12_months', 'all'].includes(filter)) {
        return res.status(400).json({ error: 'Invalid filter value' });
    }
    next();
};

const validateWebhook = (req, res, next) => {
    const { sender, message } = req.body;
    if (!sender || typeof sender !== 'string' || !message || typeof message !== 'string') {
        return res.status(400).json({ error: 'sender and message are required and must be strings' });
    }
    // Basic format check: sender should contain '@' (WhatsApp JID)
    if (!sender.includes('@')) {
        return res.status(400).json({ error: 'Invalid sender format' });
    }
    next();
};

const verifyBridgeSecret = (req, res, next) => {
    const bridgeSecret = process.env.WHATSAPP_BRIDGE_SECRET;
    if (!bridgeSecret) {
        console.error('[WhatsApp Webhook] WHATSAPP_BRIDGE_SECRET not configured — rejecting webhook');
        return res.status(500).json({ error: 'Bridge secret not configured' });
    }
    const provided = req.headers['x-bridge-secret'];
    if (!provided || provided !== bridgeSecret) {
        console.warn('[WhatsApp Webhook] Unauthorized bridge request - missing or invalid X-Bridge-Secret');
        return res.status(401).json({ error: 'Unauthorized bridge' });
    }
    next();
};

module.exports = { validateSendMessage, validateSendDirect, validateBroadcast, validateSuggestAlternative, validatePendingId, validateHistory, validateDeleteConversation, validateTestConnection, validateBroadcastDirect, validateBroadcastPreview, validateWebhook, verifyBridgeSecret };
