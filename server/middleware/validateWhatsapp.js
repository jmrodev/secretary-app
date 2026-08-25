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
    if (!contacts?.length || !templateName) {
        return res.status(400).json({ error: 'Invalid parameters: contacts and templateName required' });
    }
    next();
};

module.exports = { validateSendMessage, validateSendDirect, validateBroadcast };
