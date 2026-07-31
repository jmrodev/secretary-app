const whatsappRepository = require('../../repositories/communication/whatsappRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const scheduleRepository = require('../../repositories/appointments/scheduleRepository');
const holidayRepository = require('../../repositories/appointments/holidayRepository');
const availabilitySearchService = require('../../services/appointments/availabilitySearchService');
const patientRepository = require('../../repositories/user/patientRepository');
const pendingBookingRepository = require('../../repositories/communication/pendingBookingRepository');
const { pool } = require('../../db');

const authService = require('../../services/user/authService');

/** Default polite message used while a booking is pending secretary approval. */
const DEFAULT_PENDING_RESPONSE = 'Tu solicitud de turno está en revisión. La Secretaría te va a confirmar a la brevedad. 🙋♀️';

/**
 * WhatsAppAiService
 * Handles AI-powered features for WhatsApp communication, including suggestions and auto-booking.
 */
class WhatsAppAiService {
    async getAiSuggestion(patientId, phone, doctorId, userId) {
        if (!patientId && !phone) throw new Error('patientId o phone es requerido');

        const context = await this._buildContext(patientId, phone, doctorId, userId);

        // Re-detection guard: while a pending booking exists, do not re-detect
        // booking intent nor trigger auto-booking — respond with the pending template.
        if (context.hasPendingBooking) {
            return this._pendingStateReply(context);
        }

        // Try to auto-register if patient submitted registration details (DNI/Name)
        const autoRegisterResult = await this._tryAutoRegister(context);
        if (autoRegisterResult) return autoRegisterResult;

        // Try to auto-book if patient confirmed a slot
        const autoBookResult = await this._tryAutoBook(context, userId);
        if (autoBookResult) return autoBookResult;

        // Otherwise, generate AI suggestion as usual
        const prompt = this._buildPrompt(context);

        const groqKey = process.env.GROQ_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!groqKey && !geminiKey) throw new Error('Configuración de IA incompleta');

        let apiModel = process.env.AI_MODEL || context.doctor?.gemini_model || (geminiKey ? 'gemini-2.5-flash' : 'llama-3.3-70b-versatile');
        if (apiModel.includes('gemini-1.5')) {
            apiModel = apiModel.replace('gemini-1.5', 'gemini-2.5');
        }

        const preferGemini = geminiKey && (!groqKey || apiModel.startsWith('gemini') || context.doctor?.gemini_model?.startsWith('gemini'));

        if (preferGemini) {
            return await this._tryGemini(prompt, apiModel.startsWith('gemini') ? apiModel : 'gemini-2.5-flash', geminiKey)
                .catch(err => this._fallbackToGroq(prompt, err, groqKey));
        } else {
            return await this._tryGroq(prompt, apiModel, groqKey)
                .catch(err => this._fallbackToGemini(prompt, err, geminiKey));
        }
    }

    /**
     * Checks if the last patient message is a confirmation of an offered slot.
     * If so, inserts a whatsapp_pending_bookings row (status 'pending') instead
     * of creating the appointment directly — the secretary must approve it first.
     */
    async _tryAutoBook(context, userId) {
        if (context.hasPendingBooking) return null; // Re-detection guard
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
                // Found matching slot — queue it for secretary approval (no appointment yet)
                try {
                    await pendingBookingRepository.create({
                        patient_id: context.patientId,
                        doctor_id: context.doctor.id,
                        patient_phone: context.phone || '',
                        requested_slot_date: day.date,
                        requested_slot_time: targetTime
                    });

                    const dayName = context.doctorName;
                    const formattedDate = new Date(day.date + 'T12:00:00').toLocaleDateString('es-AR', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });

                    return `✅ Recibimos tu solicitud para el turno del ${formattedDate} a las ${targetTime} hs con ${dayName}. Tu pedido quedó en revisión y la Secretaría te confirma a la brevedad. 🙋♀️`;
                } catch (err) {
                    console.error('[AutoBook Pending Error]:', err);
                    return `Hubo un problema al reservar el turno. Consulto con la Secretaría para ayudarte. 🙋♀️`;
                }
            }
        }

        // Time matched patterns but not found in available slots
        return null;
    }

    /**
     * Builds the AI reply used while the patient's booking is pending approval.
     * Uses the doctor's configurable pending_response_template with a default fallback.
     */
    _pendingStateReply(context) {
        const template = context.doctor?.pending_response_template?.trim();
        return template || DEFAULT_PENDING_RESPONSE;
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
            return await this._tryGemini(prompt, 'gemini-2.5-flash', geminiKey);
        } catch (fallbackErr) {
            throw new Error(`Gemini primary failed: ${originalError.message} | Gemini fallback: ${fallbackErr.message}`);
        }
    }

    async _buildContext(patientId, phone, doctorId, userId) {
        let doctorContext = "Actuá como la secretaría de un consultorio médico. Respondé de forma breve y profesional. Usá los turnos disponibles de la agenda para ofrecer opciones. Si no hay turnos o el paciente pide algo fuera de la agenda, decí 'Consulto con la Secretaría y te confirmo.'";
        let historyLimit = 3;
        let doctorName = "la Secretaría";

        const doctor = doctorId ? await doctorRepository.findById(doctorId) : null;
        let patient = patientId ? await patientRepository.findById(patientId) : null;
        
        if (!patient && phone) {
            patient = await patientRepository.findByPhone(phone);
            if (patient) patientId = patient.id;
        }

        let history = [];
        if (patientId) {
            history = await whatsappRepository.getHistoryByPatient(patientId);
        } else if (phone) {
            history = await whatsappRepository.getHistoryByPhone(phone);
        }

        const patientName = patient ? patient.full_name : 'Paciente';

        // Active pending booking flag — used by the re-detection guard
        let hasPendingBooking = false;
        if (patientId) {
            try {
                const activePending = await pendingBookingRepository.findActiveByPatient(patientId);
                hasPendingBooking = !!activePending;
            } catch (err) {
                console.error('[Pending Booking Check Error]:', err);
            }
        }

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
                phone,
                hasPendingBooking,
                isRegistered: !!patient
            };
        }

        const lastMessages = history.slice(-historyLimit).map(m => `${m.direction === 'inbound' ? 'Paciente' : 'Secretaría'}: ${m.body}`).join('\n');

        return { 
            doctor, 
            doctorName, 
            doctorContext, 
            lastMessages, 
            lastPatientMessage, 
            freeSlots: [], 
            patientId,
            phone,
            hasPendingBooking,
            isRegistered: !!patient
        };
    }

    async _tryAutoRegister(ctx) {
        if (ctx.isRegistered || !ctx.lastPatientMessage) return null;

        const msg = ctx.lastPatientMessage;
        const dniMatch = msg.match(/\b(\d{7,8})\b/);
        const nameMatch = msg.match(/(?:me llamo|mi nombre es|nombre:?|soy)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ\s]{3,40})/i);

        if (dniMatch && (nameMatch || msg.split(' ').length <= 10)) {
            const dni = dniMatch[1];
            let fullName = nameMatch ? nameMatch[1].trim() : '';
            
            if (!fullName) {
                const words = msg.split(/\s+/).filter(w => !/\d/.test(w) && w.length > 2);
                if (words.length >= 2) fullName = words.join(' ');
            }

            fullName = fullName.replace(/(?:dni|documento|vivo|direccion|calle).*/i, '').trim();
            if (fullName.length < 3) fullName = `Paciente ${dni}`;

            try {
                const cleanPhone = ctx.phone ? ctx.phone.replace(/\D/g, '') : '';
                const regResult = await authService.publicRegister({ ip: '127.0.0.1' }, {
                    fullName,
                    dni,
                    phone: cleanPhone || '54900000000'
                });
                
                if (regResult && regResult.patientId) {
                    return `¡Muchas gracias, ${fullName}! Te registramos en el sistema correctamente. ¿En qué día u horario te gustaría agendar tu turno?`;
                }
            } catch (err) {
                console.error("[Auto-Register Error]:", err.message);
            }
        }
        return null;
    }

    _buildPrompt(ctx) {
        let registrationInstruction = '';
        if (!ctx.isRegistered) {
            registrationInstruction = `
IMPORTANTE REGISTRO DE PACIENTE NUEVO:
El paciente (${ctx.phone || 'Número Desconocido'}) AÚN NO ESTÁ REGISTRADO en el sistema.
Debes solicitarle amablemente los 3 datos obligatorios para darle el alta antes de agendar:
1. Nombre y Apellido completo.
2. Número de DNI.
3. Dirección / Domicilio.
Sé breve, cálido y profesional pidiendo estos datos.`;
        }

        return `
${ctx.doctorContext}
${registrationInstruction}

Historial de WhatsApp:
${ctx.lastMessages}

Respuesta sugerida:
`.trim();
    }
}

module.exports = new WhatsAppAiService();