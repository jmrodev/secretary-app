const whatsappService = require('../../services/communication/whatsappService');
const whatsappAiService = require('../../services/communication/whatsappAiService');
const whatsappRepository = require('../../repositories/communication/whatsappRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');
const defaultPool = require('../../db').pool;

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

const logoutBridge = async (req, res) => {
    try {
        await whatsappService.logoutBridge();
        res.json({ success: true, message: 'Logged out. Scan QR to reconnect.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const _getPatientsForBroadcast = async (filter) => {
    if (filter === 'all') {
        return await defaultPool.query(
            `SELECT id, full_name, phone FROM patients
             WHERE phone IS NOT NULL AND phone != '' AND LENGTH(phone) >= 8`
        );
    }
    // Default: last_12_months
    return await defaultPool.query(
        `SELECT DISTINCT p.id, p.full_name, p.phone
         FROM patients p
         INNER JOIN appointments a ON a.patient_id = p.id
         WHERE a.appointment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
           AND p.phone IS NOT NULL AND p.phone != ''
           AND LENGTH(p.phone) >= 8`
    );
};

const broadcastPreview = async (req, res) => {
    try {
        const { filter = 'last_12_months' } = req.body;
        const patients = await _getPatientsForBroadcast(filter);
        res.json({ success: true, count: patients.length });
    } catch (error) {
        console.error('[Broadcast Preview Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

const broadcastDirect = async (req, res) => {
    const { message, filter = 'last_12_months', delayMs = 4000 } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    const patients = await _getPatientsForBroadcast(filter);
    if (patients.length === 0) return res.json({ message: 'No patients found', results: { success: [], failed: [] } });

    const results = { success: [], failed: [] };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (const patient of patients) {
        const personalizedMessage = message.replace(/\{patient_name\}/gi, patient.full_name || patient.phone);
        try {
            await whatsappService.sendMessageDirect(patient.phone, personalizedMessage, patient.id);
            results.success.push({ phone: patient.phone, name: patient.full_name });
        } catch (error) {
            console.error(`[Broadcast] Failed for ${patient.phone}:`, error.message);
            results.failed.push({ phone: patient.phone, name: patient.full_name, error: error.message });
        }
        await sleep(Number(delayMs) || 4000);
    }

    res.json({ message: 'Broadcast complete', results });
};

module.exports = {
    sendMessage, broadcastMessage, broadcastDirect, broadcastPreview, testConnection, sendDirectMessage,
    receiveWebhook, getPatientHistory, getRecentConversations, getBridgeStatus, getAiSuggestion, logoutBridge
};
