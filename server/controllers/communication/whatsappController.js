const axios = require('axios');
const whatsappService = require('../../services/communication/whatsappService');
const pendingBookingService = require('../../services/communication/pendingBookingService');
const patientRepository = require('../../repositories/user/patientRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const availabilitySearchService = require('../../services/appointments/availabilitySearchService');
const whatsappAiBookingService = require('../../services/communication/whatsappAiBookingService');

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

const getAiSuggestion = async (req, res) => {
    try {
        const { patientId, phone } = req.body;
        const history = await whatsappService.getPatientHistory(patientId, phone);
        const lastMessages = (history || [])
            .slice(-10)
            .map(m => `${m.direction === 'inbound' ? 'Paciente' : 'Secretaría'}: ${m.body}`)
            .join('\n');

        if (!lastMessages.trim()) {
            return res.json({ success: true, suggestion: 'No hay mensajes previos para generar una sugerencia.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(503).json({ error: 'Configuración de IA incompleta (Falta GEMINI_API_KEY).' });
        }

        let patientName = '';
        let doctorName = 'el profesional asignado';
        let freeSlotsText = 'Sin turnos disponibles próximos.';
        let prescriptionInfo = 'Valor receta: $15.000, demora 48 hs hábiles, alias: bici.soja.risa';

        try {
            let patient = null;
            if (patientId) {
                patient = await patientRepository.findById(patientId);
            }
            if (patient) {
                patientName = patient.first_name || patient.full_name || '';
            }

            const doctorId = await whatsappAiBookingService.resolveDoctorForPatient(patientId);
            if (doctorId) {
                const doctor = await doctorRepository.findById(doctorId);
                if (doctor) {
                    doctorName = `Dr/a. ${doctor.full_name} (${doctor.specialty || 'Profesional'})`;
                    if (doctor.prescription_price || doctor.alias) {
                        const price = Number(doctor.prescription_price || 15000).toLocaleString('es-AR');
                        const alias = doctor.alias || 'bici.soja.risa';
                        prescriptionInfo = `Valor receta: $${price}, demora 48 hs hábiles, alias: ${alias}`;
                    }
                }

                const availability = await availabilitySearchService.getNextFreeSlot({
                    doctor_id: doctorId,
                    start_date: new Date(),
                    include_out_of_hours: 'false'
                });

                if (availability?.results?.length > 0) {
                    const formatted = [];
                    for (const day of availability.results.slice(0, 3)) {
                        const times = day.slots.slice(0, 3).map(s => s.time).join(', ');
                        formatted.push(`${day.dayName || day.date}: ${times} hs`);
                    }
                    freeSlotsText = formatted.join(' | ');
                }
            }
        } catch (ctxErr) {
            console.warn('[WhatsApp getAiSuggestion] Could not build full context:', ctxErr.message);
        }

        const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const prompt = `Actuá como la secretaría de Cima Salud Tandil.
Paciente: ${patientName || 'Paciente'}
Profesional asignado: ${doctorName}
Turnos libres reales en agenda: ${freeSlotsText}
Información de recetas: ${prescriptionInfo}

Historial de WhatsApp:
${lastMessages}

Instrucciones:
- Redactá una respuesta breve, educada, empática y profesional para la secretaría (máximo 35 palabras).
- Si el paciente consulta por turnos: ofrecele amablemente el próximo turno disponible real de la agenda. Si no hay lugar para el día pedido, aclará que no hay disponibilidad para esa fecha y ofrecele el primer turno disponible real.
- Si el paciente consulta por recetas o medicación: brindá la información de recetas (demora 48 hs, arancel y alias) y pedile el comprobante de pago.
- NUNCA uses comodines entre corchetes como [Día], [Horario] o [Nombre]. Usa los datos reales provistos.
- Respondé ÚNICAMENTE con el texto del mensaje que la secretaría debe enviarle al paciente, sin comillas ni notas adicionales.

Respuesta:`;

        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 250,
                temperature: 0.7
            }
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        const data = response.data;
        const suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!suggestion) {
            return res.status(500).json({ error: 'No se obtuvo sugerencia de la IA' });
        }

        res.json({ success: true, suggestion });
    } catch (error) {
        console.error('[WhatsApp getAiSuggestion Error]:', error.response?.data || error.message);
        const status = error.response?.status || 500;
        const errorMsg = error.response?.data?.error?.message || error.message;
        res.status(status).json({ error: errorMsg });
    }
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
    receiveWebhook, getPatientHistory, getAiSuggestion, getRecentConversations, getBridgeStatus, getBridgeHealth, logoutBridge, refreshBridge, deleteConversation,
    listPending, acceptPending, suggestAlternative, rejectPending
};
