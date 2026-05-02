const whatsappService = require('../services/whatsappService');
const whatsappRepository = require('../repositories/whatsappRepository');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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
    const { to, message, patientId } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Missing required parameters (to, message)' });
    }

    try {
        const result = await whatsappService.sendMessageDirect(to, message, patientId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Webhook for incoming messages from Go bridge
 */
const receiveWebhook = async (req, res) => {
    try {
        const { sender, message, isFromMe } = req.body;
        console.log(`[WhatsApp Webhook] Message from ${sender}: ${message}`);

        // Extract phone without suffix
        const phone = sender.split('@')[0];
        
        // Find patient by phone
        const patientId = await whatsappRepository.findPatientByPhone(phone);
        
        if (patientId) {
            const direction = isFromMe ? 'outbound' : 'inbound';
            await whatsappRepository.createMessage(patientId, direction, message, null, 'delivered');
            console.log(`[WhatsApp Webhook] Saved ${direction} message for patient ID: ${patientId}`);
        } else {
            console.log(`[WhatsApp Webhook] Message from unknown number: ${phone}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('[WhatsApp Webhook Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get WhatsApp history for a patient
 */
const getPatientHistory = async (req, res) => {
    try {
        const { patientId } = req.body;
        const history = await whatsappRepository.getHistoryByPatient(patientId);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get AI suggestion for a response using Gemini CLI
 */
const getAiSuggestion = async (req, res) => {
    try {
        const { patientId } = req.body;
        if (!patientId) return res.status(400).json({ error: 'patientId is required' });

        // Get recent history for context
        const history = await whatsappRepository.getHistoryByPatient(patientId);
        const lastMessages = history.slice(-3).map(m => `${m.direction === 'inbound' ? 'Paciente' : 'Secretaría'}: ${m.body}`).join('\n');

        if (!lastMessages) {
            return res.json({ success: true, suggestion: 'No hay mensajes previos para generar una sugerencia.' });
        }

        const prompt = `Actuá como la secretaría de un consultorio médico. Basado en este historial reciente de WhatsApp con un paciente, sugerí una respuesta breve, profesional y amable en español (máximo 20 palabras). Respondé SOLO con la sugerencia, sin explicaciones ni comillas.\n\nHistorial:\n${lastMessages}\n\nRespuesta sugerida:`;
        
        // Escape prompt for shell
        const escapedPrompt = prompt.replace(/"/g, '\\"');
        
        // Call Gemini CLI (using npx to ensure it's found in node_modules)
        const { stdout } = await execPromise(`echo "${escapedPrompt}" | npx gemini -o text --raw-output --accept-raw-output-risk`);
        
        const suggestion = stdout.trim();
        res.json({ success: true, suggestion });
    } catch (error) {
        console.error('[AI Suggestion Error]:', error);
        res.status(500).json({ error: 'No se pudo generar la sugerencia IA.' });
    }
};

/**
 * Get recent conversations for the global messenger
 */
const getRecentConversations = async (req, res) => {
    try {
        const { doctor_id } = req.query;
        const conversations = await whatsappRepository.getRecentConversations(doctor_id);
        res.json({ success: true, data: conversations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get the status of the local WhatsApp bridge
 */
const getBridgeStatus = async (req, res) => {
    try {
        const whatsappService = require('../services/whatsappService');
        const status = await whatsappService.getBridgeStatus();
        console.log(`[WhatsApp Controller] Bridge Status: ${status.status}, QR present: ${!!status.qr_code}`);
        res.json({ success: true, ...status });
    } catch (error) {
        console.error('[WhatsApp Controller] Error getting status:', error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    sendMessage,
    broadcastMessage,
    testConnection,
    sendDirectMessage,
    receiveWebhook,
    getPatientHistory,
    getRecentConversations,
    getBridgeStatus,
    getAiSuggestion
};
