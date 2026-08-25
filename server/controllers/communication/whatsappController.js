const whatsappService = require('../../services/communication/whatsappService');
const pendingBookingService = require('../../services/communication/pendingBookingService');

/**
 * ECC-Pattern: WhatsAppController
 * Handles orchestration of WhatsApp communication.
 * Delegated complex logic to specialized services (whatsappService).
 */

const sendMessage = async (req, res) => {
    const { to, templateName, languageCode, components } = req.body;
    try {
        const result = await whatsappService.sendTemplateMessage(to, templateName, languageCode, components);
        res.json({ success: true, data: result });
    } catch (error) { console.error('[WhatsApp sendMessage Error]:', error); res.status(500).json({ error: error.message }); }
};

const testConnection = async (req, res) => {
    const { to } = req.body;
    try {
        const result = await whatsappService.sendTestMessage(to);
        res.json({ success: true, message: 'Test message sent', data: result });
    } catch (error) { console.error('[WhatsApp testConnection Error]:', error); res.status(500).json({ error: error.message }); }
};

const broadcastMessage = async (req, res) => {
    try {
        const { contacts, templateName, languageCode, components } = req.body;
        const results = { success: [], failed: [] };
        const promises = contacts.map(async (contact) => {
            try {
                const response = await whatsappService.sendTemplateMessage(contact.phone, templateName, languageCode, components);
                return { success: true, phone: contact.phone, messageId: response.messages?.[0]?.id };
            } catch (error) { console.error(`[Broadcast] Failed for ${contact.phone}:`, error.message); return { success: false, phone: contact.phone, error: error.message }; }
        });

        const settled = await Promise.all(promises);
        settled.forEach(r => r.success ? results.success.push(r) : results.failed.push(r));
        res.json({ message: 'Broadcast complete', results });
    } catch (error) {
        console.error('[Broadcast Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

const sendDirectMessage = async (req, res) => {
    const { to, message, patientId } = req.body;
    try {
        const result = await whatsappService.sendMessageDirect(to, message, patientId);
        if (result && result.queued) {
            return res.status(202).json({ success: true, queued: true });
        }
        res.json({ success: true, data: result });
    } catch (error) { console.error('[WhatsApp sendDirectMessage Error]:', error); res.status(500).json({ error: error.message }); }
};

const receiveWebhook = async (req, res) => {
    try {
        const { sender, message, isFromMe } = req.body;
        await whatsappService.handleWebhook(sender, message, isFromMe);
        res.json({ success: true });
    } catch (error) {
        console.error('[WhatsApp Webhook Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPatientHistory = async (req, res) => {
    try {
        const { patientId, phone } = req.body;
        const history = await whatsappService.getPatientHistory(patientId, phone);
        res.json({ success: true, data: history });
    } catch (error) { console.error('[WhatsApp getPatientHistory Error]:', error); res.status(500).json({ error: error.message }); }
};



const getRecentConversations = async (req, res) => {
    try {
        const conversations = await whatsappService.getRecentConversations(req.query.doctor_id);
        res.json({ success: true, data: conversations });
    } catch (error) { console.error('[WhatsApp getRecentConversations Error]:', error); res.status(500).json({ error: error.message }); }
};

const getBridgeStatus = async (req, res) => {
    try {
        const status = await whatsappService.getBridgeStatus();
        res.json({ success: true, ...status });
    } catch (error) { console.error('[WhatsApp getBridgeStatus Error]:', error); res.status(500).json({ error: error.message }); }
};

const getBridgeHealth = async (req, res) => {
    try {
        const health = await whatsappService.getBridgeHealth();
        res.json(health);
    } catch (error) { console.error('[WhatsApp getBridgeHealth Error]:', error); res.status(500).json({ error: error.message }); }
};

const logoutBridge = async (req, res) => {
    try {
        await whatsappService.logoutBridge();
        res.json({ success: true, message: 'Logged out. Scan QR to reconnect.' });
    } catch (error) { console.error('[WhatsApp logoutBridge Error]:', error); res.status(500).json({ error: error.message }); }
};

const broadcastPreview = async (req, res) => {
    try {
        const { filter = 'last_12_months' } = req.body;
        const count = await whatsappService.getBroadcastPreview(filter);
        res.json({ success: true, count });
    } catch (error) {
        console.error('[Broadcast Preview Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

const broadcastDirect = async (req, res) => {
    try {
        const { message, filter = 'last_12_months', delayMs = 4000 } = req.body;
        const results = await whatsappService.broadcastDirect(message, filter, delayMs);
        if (results.success.length === 0 && results.failed.length === 0) {
            return res.json({ message: 'No patients found', results });
        }
        res.json({ message: 'Broadcast complete', results });
    } catch (error) {
        console.error('[Broadcast Direct Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

const refreshBridge = async (req, res) => {
    try {
        await whatsappService.refreshBridge();
        res.json({ success: true, message: 'Bridge refreshed.' });
    } catch (error) {
        console.error('Failed to refresh bridge:', error);
        res.status(500).json({ success: false, error: 'Failed to refresh bridge' });
    }
};

const deleteConversation = async (req, res) => {
    try {
        const { patientId, phone } = req.body;
        await whatsappService.deleteConversation(patientId, phone);
        res.json({ success: true, message: 'Conversación eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar conversación:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar conversación' });
    }
};

const listPending = async (req, res) => {
    try {
        const data = await pendingBookingService.listPending();
        res.json({ success: true, data });
    } catch (error) {
        console.error('[List Pending Error]:', error);
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const acceptPending = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const secretaryId = req.user?.user_id;
        const result = await pendingBookingService.acceptPending(id, secretaryId);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('[Accept Pending Error]:', error);
        const status = error.statusCode || 500;
        if (status === 404) return res.status(404).json({ success: false, error: error.message });
        if (status === 409) {
            const meta = error.meta || {};
            if (meta.status === 'phone_changed') {
                return res.status(409).json({ success: false, status: 'phone_changed', message: error.message });
            }
            if (meta.status === 'slot_taken') {
                return res.status(409).json({ success: false, status: 'slot_taken', message: error.message });
            }
            return res.status(409).json({
                success: false,
                status: meta.status || 'taken',
                accepted_by: meta.accepted_by || null,
                message: error.message
            });
        }
        if (status === 400) return res.status(400).json({ success: false, error: error.message });
        res.status(status).json({ error: error.message });
    }
};

const suggestAlternative = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { alternative_slot_iso, note } = req.body;
        const result = await pendingBookingService.suggestAlternative(id, alternative_slot_iso, note);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('[Suggest Alternative Error]:', error);
        const status = error.statusCode || 500;
        if (status === 400) return res.status(400).json({ success: false, error: error.message });
        if (status === 404) return res.status(404).json({ success: false, error: error.message });
        if (status === 409) return res.status(409).json({ success: false, status: 'taken', message: error.message, ...(error.meta || {}) });
        res.status(status).json({ error: error.message });
    }
};

const rejectPending = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { reason } = req.body;
        const result = await pendingBookingService.rejectPending(id, req.user?.user_id, reason);
        res.json(result);
    } catch (error) {
        console.error('[Reject Pending Error]:', error);
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = {
    sendMessage, broadcastMessage, broadcastDirect, broadcastPreview, testConnection, sendDirectMessage,
    receiveWebhook, getPatientHistory, getRecentConversations, getBridgeStatus, getBridgeHealth, logoutBridge, refreshBridge, deleteConversation,
    listPending, acceptPending, suggestAlternative, rejectPending
};
