const whatsappService = require('../../services/communication/whatsappService');
const whatsappAiService = require('../../services/communication/whatsappAiService');
const { AI_SETTING_KEYS } = require('../../services/communication/aiConfigResolver');
const whatsappRepository = require('../../repositories/communication/whatsappRepository');
const pendingBookingRepository = require('../../repositories/communication/pendingBookingRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const bookingService = require('../../services/appointments/bookingService');
const { ConflictError } = require('../../utils/core/errors');
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
        // AI provider/model settings: rows -> {key: value} map. On any read
        // failure fall back to an empty map so provider/model resolve from
        // env/built-in defaults (graceful degradation, no error for the user).
        let aiSettings = {};
        try {
            const rows = await systemSettingsRepository.findManyByKeys(AI_SETTING_KEYS);
            aiSettings = rows.reduce((map, row) => {
                map[row.setting_key] = row.setting_value;
                return map;
            }, {});
        } catch (settingsError) {
            console.warn('[AI Suggestion] No se pudieron leer las configuraciones de IA, usando defaults de env:', settingsError.message);
        }

        const suggestion = await whatsappAiService.getAiSuggestion(
            req.body.patientId,
            req.body.phone,
            req.doctorId,
            req.user?.user_id,
            aiSettings
        );
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
        await whatsappRepository.deleteConversation(patientId, phone);
        res.json({ success: true, message: 'Conversación eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar conversación:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar conversación' });
    }
};

/**
 * Lists active pending bookings (status pending / alternative_sent).
 * Runs the 2h alternative-timeout cleanup on every poll so stale
 * alternative questions are auto-timed-out without a background job.
 */
const listPending = async (req, res) => {
    try {
        await pendingBookingRepository.expireStaleAlternatives();
        const data = await pendingBookingRepository.findActive();
        res.json({ success: true, data });
    } catch (error) {
        console.error('[List Pending Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Accepts a pending booking: first-wins optimistic lock (WHERE status='pending'),
 * then creates the appointment. Guards: patient changed phone → auto-reject;
 * slot already taken → auto-reject with slot_taken so the secretary sees
 * "Slot no longer available".
 */
const acceptPending = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const secretaryId = req.user?.user_id;

        let pending = await pendingBookingRepository.findById(id);
        if (!pending) {
            return res.status(404).json({ success: false, error: 'Pending booking not found' });
        }

        if (pending.status !== 'pending') {
            return res.status(409).json({
                success: false,
                status: 'taken',
                accepted_by: pending.accepted_by_name || null,
                message: pending.accepted_by_name
                    ? `Already accepted by ${pending.accepted_by_name}`
                    : 'This pending booking was already resolved'
            });
        }

        // Phone-change guard: reject if the patient's current phone no longer
        // matches the phone captured when the pending was created.
        const patient = await patientRepository.findById(pending.patient_id);
        const currentPhone = (patient?.phone || '').replace(/\D/g, '');
        const pendingPhone = (pending.patient_phone || '').replace(/\D/g, '');
        if (currentPhone && pendingPhone && !currentPhone.endsWith(pendingPhone.slice(-8))) {
            await pendingBookingRepository.rejectById(id, null, 'phone_changed');
            return res.status(409).json({
                success: false,
                status: 'phone_changed',
                message: 'El paciente cambió su número de teléfono. El pedido fue rechazado.'
            });
        }

        // Optimistic lock: only one secretary can win the transition pending → accepted
        const affected = await pendingBookingRepository.acceptById(id, secretaryId);
        if (affected === 0) {
            pending = await pendingBookingRepository.findById(id);
            return res.status(409).json({
                success: false,
                status: 'taken',
                accepted_by: pending?.accepted_by_name || null,
                message: pending?.accepted_by_name
                    ? `Already accepted by ${pending.accepted_by_name}`
                    : 'Already accepted'
            });
        }

        try {
            const result = await bookingService.createAppointment(secretaryId, 'secretary', {
                patient_id: pending.patient_id,
                doctor_id: pending.doctor_id,
                appointment_date: `${pending.requested_slot_date} ${pending.requested_slot_time}:00`,
                reason: 'Turno aprobado por Secretaría'
            });

            const formattedDate = new Date(pending.requested_slot_date + 'T12:00:00').toLocaleDateString('es-AR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            await whatsappService.sendMessageDirect(
                pending.patient_phone,
                `✅ Turno confirmado: ${formattedDate} a las ${pending.requested_slot_time} hs con ${pending.doctor_name}. ¡Te esperamos! 🏥`,
                pending.patient_id
            );

            res.json({ success: true, appointment_id: result.id });
        } catch (err) {
            // Slot-taken guard: the slot got booked before approval → auto-reject
            await pendingBookingRepository.rejectById(id, null, 'slot_taken');
            if (err instanceof ConflictError) {
                return res.status(409).json({ success: false, status: 'slot_taken', message: 'Slot no longer available' });
            }
            throw err;
        }
    } catch (error) {
        console.error('[Accept Pending Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Suggests an alternative slot: marks alternative_sent and asks the patient
 * via WhatsApp. The patient's yes/no reply is handled by the AI service
 * (Phase 4 integration).
 */
const suggestAlternative = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { alternative_slot_iso, note } = req.body;
        if (!alternative_slot_iso) {
            return res.status(400).json({ success: false, error: 'alternative_slot_iso is required' });
        }

        const pending = await pendingBookingRepository.findById(id);
        if (!pending) {
            return res.status(404).json({ success: false, error: 'Pending booking not found' });
        }

        const affected = await pendingBookingRepository.suggestAlternative(id, alternative_slot_iso, note);
        if (affected === 0) {
            return res.status(409).json({
                success: false,
                status: 'taken',
                message: 'This pending booking was already resolved'
            });
        }

        const alternativeDate = new Date(alternative_slot_iso).toLocaleDateString('es-AR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const alternativeTime = alternative_slot_iso.includes('T')
            ? alternative_slot_iso.split('T')[1].slice(0, 5)
            : alternative_slot_iso;

        await whatsappService.sendMessageDirect(
            pending.patient_phone,
            `El turno que pediste no está disponible. ¿Te conviene este turno alternativo el ${alternativeDate} a las ${alternativeTime} hs? Respondé "sí" para confirmarlo. 🙋‍♀️`,
            pending.patient_id
        );

        res.json({ success: true, message: 'Alternative sent to patient' });
    } catch (error) {
        console.error('[Suggest Alternative Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Rejects a pending booking without booking (optional reason).
 */
const rejectPending = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { reason } = req.body;
        await pendingBookingRepository.rejectById(id, req.user?.user_id, reason || null);
        res.json({ success: true });
    } catch (error) {
        console.error('[Reject Pending Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    sendMessage, broadcastMessage, broadcastDirect, broadcastPreview, testConnection, sendDirectMessage,
    receiveWebhook, getPatientHistory, getRecentConversations, getBridgeStatus, getAiSuggestion, logoutBridge, refreshBridge, deleteConversation,
    listPending, acceptPending, suggestAlternative, rejectPending
};
