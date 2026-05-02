const whatsappService = require('../services/whatsappService');
const whatsappRepository = require('../repositories/whatsappRepository');
const doctorRepository = require('../repositories/doctorRepository');
const scheduleRepository = require('../repositories/scheduleRepository');
const holidayRepository = require('../repositories/holidayRepository');
const { pool } = require('../db');
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
        let patientId = await whatsappRepository.findPatientByPhone(phone);
        
        const direction = isFromMe ? 'outbound' : 'inbound';

        if (patientId) {
            await whatsappRepository.createMessage(patientId, direction, message, null, 'delivered');
            console.log(`[WhatsApp Webhook] Saved ${direction} message for patient ID: ${patientId}`);
        } else {
            console.log(`[WhatsApp Webhook] Message from unknown number: ${phone}. Creating temporary record.`);
            // Save the message with null patientId but with sender_phone
            await whatsappRepository.createMessage(null, direction, message, null, 'delivered', phone);
            
            // AUTOMATIC REPLY FOR UNKNOWN NUMBERS
            if (!isFromMe) {
                const registrationLink = `https://jmro.duckdns.org/#/p/register?phone=${phone}`;
                const autoReply = `¡Hola! 👋 Soy la asistente virtual de MediCare. No tenemos tus datos registrados.\n\nPor favor, completá tus datos en este link para que podamos agendar tu turno de forma inmediata:\n${registrationLink}\n\n⚠️ *Nota:* Si no podés completar el formulario, la secretaría te ayudará manualmente cuando esté disponible, pero esto puede demorar un tiempo. ¡El formulario es mucho más rápido! 🚀`;
                
                try {
                    await whatsappService.sendMessageDirect(phone, autoReply);
                    console.log(`[WhatsApp Webhook] Registration link sent to unknown number: ${phone}`);
                } catch (err) {
                    console.error(`[WhatsApp Webhook] Error sending auto-reply:`, err.message);
                }
            }
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
        const { patientId, phone } = req.body;
        const history = await whatsappRepository.getHistoryByPatient(patientId, phone);
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
        const doctorId = req.doctorId; // Captured from global middleware

        if (!patientId) return res.status(400).json({ error: 'patientId is required' });

        // Get Doctor context if available
        let doctorContext = "Actuá como la secretaría de un consultorio médico. Sugerí una respuesta breve, profesional y amable en español (máximo 20 palabras).";
        let historyLimit = 3;
        let doctorName = "la Secretaría";
        let extraInfo = "";

        let doctor = null;
        if (doctorId) {
            doctor = await doctorRepository.findById(doctorId);
            if (doctor) {
                doctorName = doctor.full_name;
                if (doctor.gemini_context) {
                    doctorContext = doctor.gemini_context;
                }
                if (doctor.gemini_history_limit) {
                    historyLimit = doctor.gemini_history_limit;
                }
                
                // Fetch dynamic data for variables
                const schedules = await scheduleRepository.findByDoctor(doctorId);
                const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const formattedSchedules = schedules
                    .filter(s => !s.is_break)
                    .map(s => `${daysMap[s.day_of_week]}: ${s.start_time.slice(0,5)} a ${s.end_time.slice(0,5)}`)
                    .join(', ');

                const holidays = await holidayRepository.findAll();
                const formattedHolidays = holidays
                    .map(h => `${new Date(h.date).toLocaleDateString('es-AR')} (${h.description})`)
                    .join(', ');

                const patientRepository = require('../repositories/patientRepository');
                const patient = await patientRepository.findById(patientId);
                const patientName = patient ? patient.full_name : 'Paciente';

                let secretaryName = 'la Secretaría';
                try {
                    const [secRow] = await pool.query("SELECT full_name FROM secretaries WHERE user_id = ?", [req.user.user_id]);
                    if (secRow) {
                        secretaryName = secRow.full_name;
                    } else {
                        const [uRow] = await pool.query("SELECT username FROM users WHERE id = ?", [req.user.user_id]);
                        if (uRow) secretaryName = uRow.username;
                    }
                } catch (err) { console.error("Error fetching secretary name:", err); }

                // Replace variables in context
                doctorContext = doctorContext
                    .replace(/{doctor_name}/g, doctorName)
                    .replace(/{patient_name}/g, patientName)
                    .replace(/{secretary_name}/g, secretaryName)
                    .replace(/{horarios}/g, formattedSchedules || 'No configurados')
                    .replace(/{feriados}/g, formattedHolidays || 'No hay feriados próximos')
                    .replace(/{price}/g, doctor.consultation_price || 'A convenir')
                    .replace(/{appointment_location}/g, doctor.office_number || 'Consultorio central')
                    .replace(/{cbu}/g, doctor.cbu || '')
                    .replace(/{alias}/g, doctor.alias || '')
                    .replace(/{bio}/g, doctor.bio || '');

                const availabilitySearchService = require('../services/appointments/availabilitySearchService');
                const now = new Date();
                const startDate = now.toISOString().split('T')[0];
                const freeSlotsData = await availabilitySearchService.getFreeSlotsBatch(doctorId, startDate, false);
                
                const formattedFreeSlots = freeSlotsData.results.slice(0, 7).map(day => {
                    const times = day.slots.slice(0, 6).map(s => s.time).join(', ');
                    return `${day.dayName}: ${times}${day.slots.length > 6 ? '...' : ''}`;
                }).join('\n');

                const currentDateTime = now.toLocaleString('es-AR', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });

                // Construct extra info string with REAL agenda data
                extraInfo = `
DATOS DE LA AGENDA REAL (USAR ESTO PARA TURNOS):
Fecha actual: ${currentDateTime}
Turnos DISPONIBLES (próximos 7 días):
${formattedFreeSlots || 'No hay turnos libres próximamente.'}

DATOS DEL DOCTOR:
- Especialidad: ${doctor.specialty || 'N/A'}
- Precio Consulta: $${doctor.consultation_price || 'A convenir'}
- Consultorio/Dirección: ${doctor.office_number || 'Consultorio central'}
- Pagos: ${doctor.alias || doctor.cbu || 'Consultar'}

REGLAS PARA LA IA:
1. NUNCA inventes horarios. Solo ofrece lo que ves en "Turnos DISPONIBLES".
2. Si un día no está en la lista, decí que está lleno.
3. Sé extremadamente breve (máximo 25 palabras).
`;
            }
        }

        // Get recent history for context
        const history = await whatsappRepository.getHistoryByPatient(patientId);
        const lastMessages = history.slice(-historyLimit).map(m => `${m.direction === 'inbound' ? 'Paciente' : 'Secretaría'}: ${m.body}`).join('\n');

        if (!lastMessages) {
            return res.json({ success: true, suggestion: 'No hay mensajes previos para generar una sugerencia.' });
        }

        const prompt = `
        Instrucciones del Consultorio: ${doctorContext}
        Doctor/a a cargo: ${doctorName}
        Información de Referencia del Doctor:
        ${extraInfo}

        Basado en el historial de WhatsApp de abajo, sugerí una respuesta breve, profesional y amable. 
        Si el paciente pregunta por precios o ubicación, usá la Información de Referencia de arriba.
        Respondé SOLO con la sugerencia, sin explicaciones ni comillas.

        Historial:
        ${lastMessages}

        Respuesta sugerida:
        `.trim();
        
        // Escape prompt for shell
        const escapedPrompt = prompt.replace(/"/g, '\\"');
        
        // Call Gemini API directly (Extremely fast, no CLI overhead)
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[AI] Error: GEMINI_API_KEY is not defined in environment variables.");
            return res.status(500).json({ error: 'Configuración de IA incompleta (Falta API Key).' });
        }

        const apiVersion = doctor?.gemini_api_version || 'v1beta';
        const apiModel = doctor?.gemini_model || 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${apiModel}:generateContent?key=${apiKey}`;

        console.log(`[AI Request] URL: https://generativelanguage.googleapis.com/${apiVersion}/models/${apiModel}:generateContent?key=***`);
        console.log(`[AI Request] Prompt length: ${prompt.length} chars`);
        // console.log(`[AI Request] Prompt:`, prompt); // Optional: log full prompt if needed

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 4000,
                    temperature: 0.7
                }
            })
        });

        const result = await response.json();
        console.log("[Gemini API Full Response]:", JSON.stringify(result));

        if (!response.ok) {
            console.error("[Gemini API Error Response]:", JSON.stringify(result));
            return res.status(response.status).json({ 
                success: false, 
                error: result.error?.message || 'Error en la API de Google Gemini' 
            });
        }

        console.log("[Gemini API Success Response]:", JSON.stringify(result).substring(0, 200) + "...");
        const suggestion = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!suggestion) {
            return res.status(500).json({ success: false, error: 'Google no devolvió ninguna sugerencia.' });
        }

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
