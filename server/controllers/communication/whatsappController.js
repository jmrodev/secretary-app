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
        let conversations = await whatsappRepository.getRecentConversations(req.query.doctor_id);
        const seen = new Set();
        conversations = conversations.filter(conv => {
            const phone = conv.patient_phone || conv.sender_phone;
            if (!phone || seen.has(phone)) return false;
            seen.add(phone);
            return true;
        });
        res.json({ success: true, data: conversations });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const getBridgeStatus = async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');
        const status = await whatsappService.getBridgeStatus();
        res.json({ success: true, ...status });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const disconnectBridge = async (req, res) => {
    try {
        const result = await whatsappService.disconnectBridge();
        res.json({ success: true, ...result });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const _getPatientsForBroadcast = async (filter, month, year) => {
    const base = `SELECT DISTINCT p.id, p.full_name, p.phone FROM patients p`;
    const phoneFilter = `p.phone IS NOT NULL AND p.phone != '' AND LENGTH(p.phone) >= 8`;

    if (filter === 'all') {
        return await defaultPool.query(
            `${base} WHERE ${phoneFilter}`
        );
    }

    if (filter === 'upcoming') {
        return await defaultPool.query(
            `${base} INNER JOIN appointments a ON a.patient_id = p.id
             WHERE a.appointment_date >= CURDATE() AND ${phoneFilter}`
        );
    }

    if (filter === 'year_to_date') {
        return await defaultPool.query(
            `${base} INNER JOIN appointments a ON a.patient_id = p.id
             WHERE a.appointment_date >= DATE_FORMAT(NOW(), '%Y-01-01') AND ${phoneFilter}`
        );
    }

    if (filter === 'month') {
        const m = month || new Date().getMonth() + 1;
        const y = year || new Date().getFullYear();
        return await defaultPool.query(
            `${base} INNER JOIN appointments a ON a.patient_id = p.id
             WHERE YEAR(a.appointment_date) = ? AND MONTH(a.appointment_date) = ? AND ${phoneFilter}`,
            [y, m]
        );
    }

    if (filter === 'attended') {
        return await defaultPool.query(
            `${base} INNER JOIN appointments a ON a.patient_id = p.id
             WHERE a.status = 'attended' AND ${phoneFilter}`
        );
    }

    if (filter === 'ever') {
        return await defaultPool.query(
            `${base} INNER JOIN appointments a ON a.patient_id = p.id
             WHERE a.appointment_date IS NOT NULL AND ${phoneFilter}`
        );
    }

    // Default: last_12_months
    return await defaultPool.query(
        `${base} INNER JOIN appointments a ON a.patient_id = p.id
         WHERE a.appointment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND ${phoneFilter}`
    );
};

const broadcastPreview = async (req, res) => {
    try {
        const { filter = 'last_12_months', month, year, limit = 0 } = req.body;
        let patients = await _getPatientsForBroadcast(filter, month, year);
        const totalCount = patients.length;
        if (limit > 0 && patients.length > limit) {
            patients = patients.slice(0, limit);
        }
        res.json({ 
            success: true, 
            count: patients.length, 
            totalCount,
            recipients: patients.map(p => ({ id: p.id, full_name: p.full_name, phone: p.phone })) 
        });
    } catch (error) {
        console.error('[Broadcast Preview Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

const _randomDelay = (base, variance) => {
    const ms = base + Math.floor(Math.random() * variance);
    return new Promise(r => setTimeout(r, ms));
};

const broadcastDirect = async (req, res) => {
    const { message, filter = 'last_12_months', month, year, limit = 0 } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    let patients = await _getPatientsForBroadcast(filter, month, year);
    if (limit > 0 && patients.length > limit) {
        patients = patients.slice(0, limit);
    }
    if (patients.length === 0) return res.json({ message: 'No patients found', results: { success: [], failed: [] } });

    const results = { success: [], failed: [] };

    // Preset generic random headers and footers with emojis for anti-spam spinning
    const HEADERS = [
        "👋 ¡Hola {patient_name}! Esperamos que estés muy bien. 🌿",
        "✨ Estimado/a {patient_name}, un gusto saludarte.",
        "💬 ¡Buenas {patient_name}! ¿Cómo estás? 🙂",
        "🌟 ¡Hola {patient_name}! Esperamos que tengas un excelente día.",
        "📩 Estimado/a {patient_name}, te enviamos un cordial saludo. 🌸"
    ];

    const FOOTERS = [
        "\n\nQuedamos a disposición ante cualquier consulta. ¡Que tengas un buen día! ✨",
        "\n\nAnte cualquier duda o consulta, podés responder a este mensaje. ¡Saludos! 💬",
        "\n\nSi necesitás realizar alguna consulta, estamos a tu disposición por este medio. 🙏",
        "\n\nCualquier inquietud no dudes en responder este mensaje. ¡Saludos cordiales! 👍",
        "\n\nQuedamos en contacto por este canal ante cualquier duda. ¡Muchas gracias! 😊"
    ];

    // If explicit variants are given using '---', use those; otherwise combine auto headers & footers
    const hasManualVariants = message.includes('---');
    const templates = hasManualVariants 
        ? message
            .split('---')
            .map(template => template.trim())
            .filter(template => template.length > 0)
        : [];

    for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        let personalizedMessage;

        if (hasManualVariants) {
            const template = templates[i % templates.length];
            personalizedMessage = template.replace(/\{patient_name\}/gi, patient.full_name || patient.phone);
        } else {
            const header = HEADERS[i % HEADERS.length].replace(/\{patient_name\}/gi, patient.full_name || patient.phone);
            const footer = FOOTERS[(i * 3) % FOOTERS.length];
            personalizedMessage = `${header}\n\n${message.trim()}${footer}`;
        }
        try {
            await whatsappService.sendMessageDirect(patient.phone, personalizedMessage, patient.id);
            results.success.push({ phone: patient.phone, name: patient.full_name });
        } catch (error) {
            console.error(`[Broadcast] Failed for ${patient.phone}:`, error.message);
            results.failed.push({ phone: patient.phone, name: patient.full_name, error: error.message });
        }
        if (i < patients.length - 1) {
            // Human-like delay: 10 to 25 seconds between messages
            await _randomDelay(10000, 15000);

            // Batch pause: rest 1 hour (3600 seconds) every 20 messages sent
            if ((i + 1) % 20 === 0) {
                console.log(`[Broadcast] Batch pause at message ${i + 1}/${patients.length}... Resting 1 hour (3600s) to limit to 20 messages per hour.`);
                await _randomDelay(3600000, 60000);
            }
        }
    }

    res.json({ message: 'Broadcast complete', results });
};

module.exports = {
    sendMessage, broadcastMessage, broadcastDirect, broadcastPreview, testConnection, sendDirectMessage,
    receiveWebhook, getPatientHistory, getRecentConversations, getBridgeStatus, disconnectBridge, getAiSuggestion
};
