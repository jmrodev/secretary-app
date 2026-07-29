const whatsappRepository = require('../../repositories/communication/whatsappRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const scheduleRepository = require('../../repositories/appointments/scheduleRepository');
const holidayRepository = require('../../repositories/appointments/holidayRepository');
const availabilitySearchService = require('../../services/appointments/availabilitySearchService');
const patientRepository = require('../../repositories/user/patientRepository');
const bookingService = require('../../services/appointments/bookingService');
const { formatLocalSQL } = require('../../utils/core/dateUtils');
const { pool } = require('../../db');
const systemSettingsService = require('../system/systemSettingsService');

/**
 * WhatsAppAiService
 * Handles AI-powered features for WhatsApp communication, including suggestions and auto-booking.
 */
class WhatsAppAiService {
    async getAiSuggestion(patientId, doctorId, userId) {
        if (!patientId) throw new Error('patientId is required');

        const context = await this._buildContext(patientId, doctorId, userId);

        // Try to auto-book if patient confirmed a slot
        const autoBookResult = await this._tryAutoBook(context, userId);
        if (autoBookResult) return autoBookResult;

        // Otherwise, generate AI suggestion as usual
        const prompt = this._buildPrompt(context);

        const groqKey = process.env.GROQ_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!groqKey && !geminiKey) throw new Error('Configuración de IA incompleta');

        const apiModel = process.env.AI_MODEL || context.doctor?.gemini_model || 'llama-3.3-70b-versatile';

        // Determine provider priority from system setting (default: groq first)
        const aiProvider = (await systemSettingsService.getPublicSettings()).ai_provider || 'groq';
        const preferGemini = aiProvider === 'gemini';
        const preferGroq = !preferGemini;

        if (preferGroq && groqKey) {
            return await this._tryGroq(prompt, apiModel, groqKey)
                .catch(err => this._fallbackToGemini(prompt, err, geminiKey));
        }

        if (preferGemini && geminiKey) {
            return await this._tryGemini(prompt, apiModel, geminiKey)
                .catch(err => this._fallbackToGroq(prompt, err, groqKey));
        }

        // Fallback if preferred provider has no key: use whichever is available
        if (groqKey) {
            return await this._tryGroq(prompt, apiModel, groqKey)
                .catch(err => this._fallbackToGemini(prompt, err, geminiKey));
        }
        return await this._tryGemini(prompt, apiModel, geminiKey)
            .catch(err => this._fallbackToGroq(prompt, err, groqKey));
    }

    /**
     * Checks if the last patient message is a confirmation of an offered slot.
     * If so, books the appointment automatically and returns a confirmation message.
     */
    async _tryAutoBook(context, userId) {
        if (!context.doctor || !context.freeSlots?.length) return null;
        if (!context.lastPatientMessage) return null;

        const msg = context.lastPatientMessage.toLowerCase().trim();

        // Patterns: "si al de las 9", "el de las 9", "si a las 9:00", "quiero el de las 9", etc.
        const timePatterns = [
            /si\s*(?:al|el)?\s*(?:de\s*)?las\s*(\d{1,2})(?::(\d{2}))?\s*(?:hs)?/,
            /(?:el|a)\s*(?:de\s*)?las\s*(\d{1,2})(?::(\d{2}))?\s*(?:hs)?/,
            /dale\s*(?:al|el)?\s*(?:de\s*)?las\s*(\d{1,2})(?::(\d{2}))?\s*(?:hs)?/,
            /quiero\s*(?:el\s*)?(?:de\s*)?las\s*(\d{1,2})(?::(\d{2}))?\s*(?:hs)?/,
            /confirmo\s*(?:el\s*)?(?:de\s*)?las\s*(\d{1,2})(?::(\d{2}))?\s*(?:hs)?/,
        ];

        let extractedHour = null;
        let extractedMinute = '00';
        for (const pattern of timePatterns) {
            const match = msg.match(pattern);
            if (match) {
                extractedHour = match[1].padStart(2, '0');
                extractedMinute = match[2] || '00';
                break;
            }
        }

        if (!extractedHour) return null; // Not a confirmation with a time

        const targetTime = `${extractedHour}:${extractedMinute}`;

        // Search for the matching slot across all days
        for (const day of context.freeSlots) {
            const slot = day.slots.find(s => s.time === targetTime);
            if (slot) {
                // Found matching slot — create the appointment
                try {
                    const appointmentDate = `${day.date} ${targetTime}:00`;
                    const result = await bookingService.createAppointment(userId, 'secretary', {
                        patient_id: context.patientId,
                        doctor_id: context.doctor.id,
                        appointment_date: appointmentDate,
                        reason: 'Turno solicitado por WhatsApp',
                    });

                    const dayName = context.doctorName;
                    const formattedDate = new Date(day.date + 'T12:00:00').toLocaleDateString('es-AR', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });

                    return `✅ Turno reservado: ${formattedDate} a las ${targetTime} hs con ${dayName}. ¡Te esperamos! 🏥`;
                } catch (err) {
                    if (err.message?.includes('slot_already_taken') || err.message?.includes('ya existe')) {
                        return `El turno de las ${targetTime} ya fue reservado por otro paciente. Consulto con la Secretaría para ofrecerte un nuevo horario. 🙋‍♀️`;
                    }
                    console.error('[AutoBook Error]:', err);
                    return `Hubo un problema al reservar el turno. Consulto con la Secretaría para ayudarte. 🙋‍♀️`;
                }
            }
        }

        // Time matched patterns but not found in available slots
        return null;
    }

    async _tryGroq(prompt, model, apiKey) {
        if (!apiKey) throw new Error('GROQ_API_KEY no configurada');

        const url = 'https://api.groq.com/openai/v1/chat/completions';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        const result = await response.json();
        if (!response.ok) {
            const errMsg = result.error?.message || 'Error en la API de Groq';
            const apiError = new Error(errMsg);
            apiError.apiProvider = 'groq';
            throw apiError;
        }

        const suggestion = result.choices?.[0]?.message?.content?.trim();
        if (!suggestion) throw new Error('Groq no devolvió ninguna sugerencia.');
        return suggestion;
    }

    async _tryGemini(prompt, model, apiKey) {
        if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.7
                }
            })
        });

        const result = await response.json();
        if (!response.ok) {
            const errMsg = result.error?.message || 'Error en la API de Gemini';
            const apiError = new Error(errMsg);
            apiError.apiProvider = 'gemini';
            throw apiError;
        }

        const suggestion = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!suggestion) throw new Error('Gemini no devolvió ninguna sugerencia.');
        return suggestion;
    }

    async _fallbackToGroq(prompt, originalError, groqKey) {
        console.warn(`[AI Fallback] Intentando Groq. Error original: ${originalError.message}`);
        if (!groqKey) throw originalError;
        try {
            return await this._tryGroq(prompt, 'llama-3.3-70b-versatile', groqKey);
        } catch (fallbackErr) {
            throw new Error(`Groq primary failed: ${originalError.message} | Groq fallback: ${fallbackErr.message}`);
        }
    }

    async _fallbackToGemini(prompt, originalError, geminiKey) {
        console.warn(`[AI Fallback] Intentando Gemini. Error original: ${originalError.message}`);
        if (!geminiKey) throw originalError;
        try {
            return await this._tryGemini(prompt, 'gemini-1.5-flash', geminiKey);
        } catch (fallbackErr) {
            throw new Error(`Gemini primary failed: ${originalError.message} | Gemini fallback: ${fallbackErr.message}`);
        }
    }

    async _buildContext(patientId, doctorId, userId) {
        let doctorContext = "Actuá como la secretaría de un consultorio médico. Respondé de forma breve y profesional. Usá los turnos disponibles de la agenda para ofrecer opciones. Si no hay turnos o el paciente pide algo fuera de la agenda, decí 'Consulto con la Secretaría y te confirmo.'";
        let historyLimit = 3;
        let doctorName = "la Secretaría";

        const doctor = doctorId ? await doctorRepository.findById(doctorId) : null;
        const patient = await patientRepository.findById(patientId);
        const patientName = patient ? patient.full_name : 'Paciente';
        const history = await whatsappRepository.getHistoryByPatient(patientId);

        // Extract last patient message for auto-booking detection
        const lastPatientMessage = history
            .filter(m => m.direction === 'inbound')
            .pop()?.body || null;

        if (doctor) {
            doctorName = doctor.full_name;
            if (doctor.gemini_context) doctorContext = doctor.gemini_context;
            if (doctor.gemini_history_limit) historyLimit = doctor.gemini_history_limit;
            
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

            let secretaryName = 'la Secretaría';
            try {
                const [secRow] = await pool.query("SELECT full_name FROM secretaries WHERE user_id = ?", [userId]);
                if (secRow) secretaryName = secRow.full_name;
                else {
                    const [uRow] = await pool.query("SELECT username FROM users WHERE id = ?", [userId]);
                    if (uRow) secretaryName = uRow.username;
                }
            } catch (err) { console.error("Error fetching secretary name:", err); }

            const now = new Date();
            const freeSlotsData = await availabilitySearchService.getFreeSlotsBatch(doctorId, now.toISOString().split('T')[0], false);
            const formattedFreeSlots = freeSlotsData.results.slice(0, 14).map(day => {
                const times = day.slots.slice(0, 8).map(s => s.time).join(', ');
                return `${day.dayName}: ${times}${day.slots.length > 8 ? ' (+' + (day.slots.length - 8) + ' más)' : ''}`;
            }).join('\n');

            const currentDateTime = now.toLocaleString('es-AR', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });

            const paymentInfo = [doctor.cbu, doctor.alias].filter(Boolean).join(' / ') || 'Consultar';

            // Inject ALL dynamic variables into doctorContext (both old and new names for backward compat)
            doctorContext = doctorContext
                .replace(/{doctor_name}/g, doctorName)
                .replace(/{patient_name}/g, patientName)
                .replace(/{secretary_name}/g, secretaryName)
                .replace(/{free_slots}/g, formattedFreeSlots || 'No hay turnos libres próximamente.')
                .replace(/{current_datetime}/g, currentDateTime)
                .replace(/{doctor_specialty}/g, doctor.specialty || 'N/A')
                .replace(/{doctor_schedule}/g, formattedSchedules || 'No configurados')
                .replace(/{holidays}/g, formattedHolidays || 'No hay feriados próximos')
                .replace(/{doctor_price}/g, doctor.consultation_price != null ? `$${doctor.consultation_price}` : 'A convenir')
                .replace(/{doctor_location}/g, doctor.office_number || 'Consultorio central')
                .replace(/{doctor_payment}/g, paymentInfo)
                // Backward compat with old variable names
                .replace(/{bio}/g, doctor.bio || '')
                .replace(/{horarios}/g, formattedSchedules || 'No configurados')
                .replace(/{feriados}/g, formattedHolidays || 'No hay feriados próximos')
                .replace(/{price}/g, doctor.consultation_price ?? 'A convenir')
                .replace(/{appointment_location}/g, doctor.office_number || 'Consultorio central')
                .replace(/{cbu}/g, doctor.cbu || '')
                .replace(/{alias}/g, doctor.alias || '');

            return {
                doctor,
                doctorName,
                doctorContext,
                lastMessages: history.slice(-historyLimit).map(m => `${m.direction === 'inbound' ? 'Paciente' : 'Secretaría'}: ${m.body}`).join('\n'),
                lastPatientMessage,
                freeSlots: freeSlotsData.results,
                patientId,
            };
        }

        const lastMessages = history.slice(-historyLimit).map(m => `${m.direction === 'inbound' ? 'Paciente' : 'Secretaría'}: ${m.body}`).join('\n');

        return { doctor, doctorName, doctorContext, lastMessages, lastPatientMessage, freeSlots: [], patientId };
    }

    _buildPrompt(ctx) {
        return `
${ctx.doctorContext}

Historial de WhatsApp:
${ctx.lastMessages}

Respuesta sugerida:
`.trim();
    }
}

module.exports = new WhatsAppAiService();