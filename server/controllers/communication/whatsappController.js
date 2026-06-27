const whatsappService = require('../../services/communication/whatsappService');
const whatsappAiService = require('../../services/communication/whatsappAiService');
const whatsappRepository = require('../../repositories/communication/whatsappRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');

/**
 * ECC-Pattern: WhatsAppController
 * Handles orchestration of WhatsApp communication.
 * Delegated complex logic to specialized services (whatsappService, whatsappAiService).
 */

const sendMessage = async (req, res) => {
    const { to, templateName, languageCode, components } = req.body;
    if (!to || !templateName) return res.status(400).json({ error: 'Missing required parameters' });
    try {
        const result = await whatsappService.sendTemplateMessage(to, templateName, languageCode, components);
        res.json({ success: true, data: result });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const testConnection = async (req, res) => {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Target phone number is required.' });
    try {
        const result = await whatsappService.sendTestMessage(to);
        res.json({ success: true, message: 'Test message sent', data: result });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const broadcastMessage = async (req, res) => {
    const { contacts, templateName, languageCode, components } = req.body;
    if (!contacts?.length || !templateName) return res.status(400).json({ error: 'Invalid parameters' });

    const results = { success: [], failed: [] };
    const promises = contacts.map(async (contact) => {
        try {
            const response = await whatsappService.sendTemplateMessage(contact.phone, templateName, languageCode, components);
            return { success: true, phone: contact.phone, messageId: response.messages?.[0]?.id };
        } catch (error) { return { success: false, phone: contact.phone, error: error.message }; }
    });

    const settled = await Promise.all(promises);
    settled.forEach(r => r.success ? results.success.push(r) : results.failed.push(r));
    res.json({ message: 'Broadcast complete', results });
};

const sendDirectMessage = async (req, res) => {
    const { to, message, patientId } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'Missing to or message' });
    try {
        const result = await whatsappService.sendMessageDirect(to, message, patientId);
        res.json({ success: true, data: result });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const receiveWebhook = async (req, res) => {
    try {
        const { sender, message, isFromMe } = req.body;
        const phone = sender.split('@')[0];
        let patientId = await whatsappRepository.findPatientByPhone(phone);
        const direction = isFromMe ? 'outbound' : 'inbound';

        await whatsappRepository.createMessage(patientId, direction, message, null, 'delivered', patientId ? null : phone);

        if (!patientId && !isFromMe) {
            await _handleAutoReplyUnknown(phone);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('[WhatsApp Webhook Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

const _handleAutoReplyUnknown = async (phone) => {
    const autoRespondSetting = await systemSettingsRepository.findByKey('whatsapp_auto_respond_unknown');
    if (autoRespondSetting?.setting_value === '1') {
        const domainSetting = await systemSettingsRepository.findByKey('duckdns_domain');
        const domain = domainSetting?.setting_value;
        if (!domain) {
            console.warn('[WhatsApp]: Cannot send auto-reply, duckdns_domain is not configured in settings.');
            return;
        }
        const link = `https://${domain}.duckdns.org/#/p/register?phone=${phone}`;
        const autoReply = `¡Hola! 👋 Soy la asistente virtual. No tenemos tus datos registrados.\n\nPor favor, completalos en este link:\n${link}`;
        await whatsappService.sendMessageDirect(phone, autoReply);
    }
};

const getPatientHistory = async (req, res) => {
    try {
        const { patientId, phone } = req.body;
        const history = await whatsappRepository.getHistoryByPatient(patientId, phone);
        res.json({ success: true, data: history });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const getAiSuggestion = async (req, res) => {
    try {
        const suggestion = await whatsappAiService.getAiSuggestion(req.body.patientId, req.doctorId, req.user?.user_id);
        res.json({ success: true, suggestion });
    } catch (error) {
        console.error('[AI Suggestion Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

const getRecentConversations = async (req, res) => {
    try {
        const conversations = await whatsappRepository.getRecentConversations(req.query.doctor_id);
        res.json({ success: true, data: conversations });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const getBridgeStatus = async (req, res) => {
    try {
        const status = await whatsappService.getBridgeStatus();
        res.json({ success: true, ...status });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = {
    sendMessage, broadcastMessage, testConnection, sendDirectMessage,
    receiveWebhook, getPatientHistory, getRecentConversations, getBridgeStatus, getAiSuggestion
};
