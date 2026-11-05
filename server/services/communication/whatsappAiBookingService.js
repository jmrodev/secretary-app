const axios = require('axios');
const Sentry = require('@sentry/node');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const pendingBookingRepository = require('../../repositories/communication/pendingBookingRepository');
const availabilitySearchService = require('../appointments/availabilitySearchService');
const whatsappService = require('./whatsappService');

if (process.env.SENTRY_DSN) {
    try {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: 1.0
        });
    } catch (e) {
        console.warn('[AI Booking] Sentry initialization skipped:', e.message);
    }
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 25000;

async function resolveDoctorCandidates({ requestedDoctorName, patientId }) {
    if (requestedDoctorName && typeof requestedDoctorName === 'string') {
        const cleanName = requestedDoctorName.trim().toLowerCase();
        try {
            const allDoctors = await doctorRepository.findAll();
            if (Array.isArray(allDoctors) && allDoctors.length > 0) {
                const matches = allDoctors.filter(d => {
                    const first = (d.first_name || '').toLowerCase();
                    const last = (d.last_name || '').toLowerCase();
                    const full = (d.full_name || `${first} ${last}`).toLowerCase();
                    return first.includes(cleanName) || last.includes(cleanName) || full.includes(cleanName);
                });

                if (matches.length > 0) {
                    return matches;
                }
            }
        } catch (err) {
            console.error('[AI Booking] Error searching doctor by name:', err.message);
            Sentry.captureException(err, { extra: { requestedDoctorName, patientId } });
        }
    }

    if (patientId) {
        try {
            const lastAppointment = await appointmentRepository.findLastByPatientId(patientId);
            if (lastAppointment && lastAppointment.doctor_id) {
                const doc = await doctorRepository.findById(lastAppointment.doctor_id);
                if (doc) return [doc];
                return [{ id: lastAppointment.doctor_id, full_name: 'Médico de cabecera' }];
            }

            const firstDoctor = await doctorRepository.findFirst();
            if (firstDoctor && firstDoctor.id) {
                return [firstDoctor];
            }
        } catch (err) {
            console.error('[AI Booking] Error resolving fallback doctor:', err.message);
            Sentry.captureException(err, { extra: { patientId } });
        }
    }

    return [];
}

async function checkDoctorShiftConstraint(doctorId, preferredShift) {
    if (!preferredShift || !['manana', 'tarde'].includes(preferredShift)) {
        return { isCompatible: true };
    }

    try {
        const schedules = await doctorRepository.getDoctorSchedules(doctorId);
        if (!Array.isArray(schedules) || schedules.length === 0) {
            return { isCompatible: true };
        }

        const hasMorning = schedules.some(s => {
            const startHour = parseInt((s.start_time || '00:00').split(':')[0], 10);
            return startHour < 13;
        });

        const hasAfternoon = schedules.some(s => {
            const endHour = parseInt((s.end_time || '00:00').split(':')[0], 10);
            return endHour > 13;
        });

        if (preferredShift === 'tarde' && !hasAfternoon && hasMorning) {
            return {
                isCompatible: false,
                reason: 'only_morning',
                message: 'atiende únicamente por la mañana (08:00 a 13:00 hs)'
            };
        }

        if (preferredShift === 'manana' && !hasMorning && hasAfternoon) {
            return {
                isCompatible: false,
                reason: 'only_afternoon',
                message: 'atiende únicamente por la tarde (a partir de las 13:00 hs)'
            };
        }
    } catch (err) {
        console.warn('[AI Booking] Could not verify doctor shift constraints:', err.message);
    }

    return { isCompatible: true };
}

function getToolDefinition() {
    return {
        name: 'gestionar_solicitud_turno',
        description: 'Detecta solicitud o consulta de turno médico con el profesional y preferencia horaria.',
        parameters: {
            type: 'OBJECT',
            properties: {
                doctor_solicitado: {
                    type: 'STRING',
                    description: 'Nombre o apellido del médico si el paciente lo menciona (ej: Cecilia, Gomez, Dr. Perez)'
                },
                preferencia_franja: {
                    type: 'STRING',
                    enum: ['manana', 'tarde', 'indistinto'],
                    description: 'Preferencia horaria indicada por el paciente (manana o tarde)'
                },
                dias_adelante: {
                    type: 'NUMBER',
                    description: 'Días hacia adelante para buscar disponibilidad'
                }
            }
        }
    };
}

async function analyzeIntentWithGemini(messageText) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];

    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const tools = [{ functionDeclarations: [getToolDefinition()] }];
    const systemPrompt =
        'Eres el asistente virtual del consultorio médico. ' +
        'Si el paciente solicita, pide, necesita o consulta por un turno médico, ' +
        'invoca la herramienta "gestionar_solicitud_turno" extrayendo el nombre del doctor y la preferencia de turno si las menciona.';

    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: messageText }] }],
        tools
    };

    const res = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
    });

    const parts = res.data?.candidates?.[0]?.content?.parts || [];
    const calls = [];
    for (const part of parts) {
        if (part.functionCall) {
            calls.push({
                name: part.functionCall.name,
                arguments: part.functionCall.args || {}
            });
        }
    }
    return calls;
}

async function analyzeIntentWithOllama(messageText) {
    const toolDef = getToolDefinition();
    const tools = [
        {
            type: 'function',
            function: {
                name: toolDef.name,
                description: toolDef.description,
                parameters: {
                    type: 'object',
                    properties: {
                        doctor_solicitado: { type: 'string', description: 'Nombre o apellido del médico mencionado' },
                        preferencia_franja: { type: 'string', enum: ['manana', 'tarde', 'indistinto'] },
                        dias_adelante: { type: 'number' }
                    }
                }
            }
        }
    ];

    const systemPrompt =
        'Eres el asistente virtual del consultorio médico. ' +
        'Si el paciente solicita o consulta por un turno médico, ' +
        'invoca la herramienta "gestionar_solicitud_turno".';

    const payload = {
        model: OLLAMA_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: messageText }
        ],
        tools,
        stream: false,
        options: { temperature: 0.0 }
    };

    const res = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, payload, { timeout: OLLAMA_TIMEOUT_MS });
    return res.data?.message;
}

function extractToolCalls(responseMessage) {
    if (!responseMessage) return [];
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        return responseMessage.tool_calls.map(tc => ({
            name: tc.function?.name,
            arguments: tc.function?.arguments || {}
        }));
    }

    const content = (responseMessage.content || '').trim();
    const clean = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
        const parsed = JSON.parse(clean);
        if (parsed.name && parsed.arguments) {
            return [{ name: parsed.name, arguments: parsed.arguments }];
        }
    } catch {
        // regex fallback
    }

    const regex = /\{[^{}]*"name"\s*:\s*"(?:gestionar_solicitud_turno|buscar_turnos_disponibles)"[^{}]*\}/g;
    const matches = clean.match(regex);
    if (matches) {
        return matches.map(m => {
            try {
                return JSON.parse(m);
            } catch {
                return null;
            }
        }).filter(Boolean);
    }

    return [];
}

async function notifyPatient(phone, message, patientId) {
    if (!phone || !message) return;
    try {
        if (whatsappService && typeof whatsappService.sendMessageDirect === 'function') {
            await whatsappService.sendMessageDirect(phone, message, patientId);
        }
    } catch (err) {
        console.warn(`[AI Booking] Failed to send WhatsApp notification to ${phone}:`, err.message);
    }
}

async function processInboundMessage({ sender: _sender, message, patientId, phone }) {
    if (!patientId || !message || typeof message !== 'string') {
        return null;
    }

    try {
        const active = await pendingBookingRepository.findActiveByPatient(patientId);
        if (active) {
            console.log(`[AI Booking] Patient ${patientId} already has an active pending booking. Skipping duplicate.`);
            return null;
        }
    } catch (err) {
        console.warn('[AI Booking] Could not check active pending bookings:', err.message);
        Sentry.captureException(err, { extra: { patientId } });
    }

    let toolCalls = [];
    if (process.env.GEMINI_API_KEY) {
        try {
            toolCalls = await analyzeIntentWithGemini(message);
        } catch (err) {
            console.warn(`[AI Booking] Gemini intent error (${err.message}). Trying Ollama fallback.`);
            Sentry.captureException(err, { extra: { patientId, message } });
        }
    }
    if (toolCalls.length === 0) {
        try {
            const responseMessage = await analyzeIntentWithOllama(message);
            toolCalls = extractToolCalls(responseMessage);
        } catch (err) {
            console.warn(`[AI Booking] Ollama unreachable or error (${err.message}). Skipping.`);
            Sentry.captureException(err, { extra: { patientId, message } });
            return null;
        }
    }

    const bookingCall = toolCalls.find(tc =>
        tc.name === 'gestionar_solicitud_turno' || tc.name === 'buscar_turnos_disponibles'
    );

    if (!bookingCall) {
        return null;
    }

    const args = bookingCall.arguments || {};
    const requestedDoctorName = args.doctor_solicitado || null;
    const preferredShift = args.preferencia_franja || null;

    const doctorCandidates = await resolveDoctorCandidates({ requestedDoctorName, patientId });

    if (doctorCandidates.length === 0) {
        const reply = 'Hola! Hemos recibido tu consulta por un turno. En breve la secretaria te contactará para coordinar con el profesional adecuado.';
        await notifyPatient(phone, reply, patientId);
        return { status: 'doctor_not_found' };
    }

    if (doctorCandidates.length > 1) {
        const optionsList = doctorCandidates
            .map(d => `• Dr/a. ${d.full_name || `${d.first_name} ${d.last_name}`} (${d.specialty || 'General'})`)
            .join('\n');

        const reply = `Hola! Encontramos más de un profesional con ese nombre:\n${optionsList}\n\n¿Con cuál de ellos deseas solicitar tu turno?`;
        await notifyPatient(phone, reply, patientId);
        console.log(`[AI Booking] Disambiguation prompt sent to patient ${patientId} (${doctorCandidates.length} options).`);
        return { status: 'disambiguation_required', candidates: doctorCandidates };
    }

    const doctor = doctorCandidates[0];
    const doctorId = doctor.id;
    const doctorName = doctor.full_name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'tu médico';

    const shiftCheck = await checkDoctorShiftConstraint(doctorId, preferredShift); 
    let shiftWarning = '';
    if (!shiftCheck.isCompatible) {
        shiftWarning = ` Ten en cuenta que ${doctorName} ${shiftCheck.message}.`;
    }

    try {
        const availability = await availabilitySearchService.getNextFreeSlot({
            doctor_id: doctorId,
            start_date: new Date(),
            include_out_of_hours: 'false'
        });

        const dayGroup = availability?.results?.[0];
        const firstSlot = dayGroup?.slots?.[0];

        if (!dayGroup?.date || !firstSlot?.time) {
            const reply = `Hola! ${doctorName} no dispone de turnos libres próximos.${shiftWarning} Ya notificamos a la secretaria para que revise la lista de espera y te avise si se libera un espacio.`;
            await notifyPatient(phone, reply, patientId);
            console.log(`[AI Booking] Fully booked notification sent for Dr. ${doctorId} to patient ${patientId}.`);
            return { status: 'fully_booked', doctorId };
        }

        const pendingId = await pendingBookingRepository.create({
            patient_id: patientId,
            doctor_id: doctorId,
            patient_phone: phone,
            patient_message: message,
            requested_slot_date: dayGroup.date,
            requested_slot_time: firstSlot.time
        });

        const ackMessage = `Hola! Registramos tu pedido para ${doctorName}.${shiftWarning} El turno sugerido más próximo es el ${dayGroup.date} a las ${firstSlot.time} hs. La secretaría revisará tu solicitud y te enviará la confirmación definitiva a la brevedad.`;
        await notifyPatient(phone, ackMessage, patientId);

        console.log(`[AI Booking] ✅ Created pending booking #${pendingId} for patient ${patientId} (${doctorName}) on ${dayGroup.date} ${firstSlot.time}`);
        return { pendingId, date: dayGroup.date, time: firstSlot.time, doctorId };
    } catch (err) {
        console.error('[AI Booking] Failed to create pending booking:', err.message);
        Sentry.captureException(err, { extra: { patientId, doctorId, message } });
        return null;
    }
}

async function resolveDoctorForPatient(patientId) {
    const candidates = await resolveDoctorCandidates({ patientId });
    return candidates.length > 0 ? candidates[0].id : null;
}

module.exports = {
    processInboundMessage,
    resolveDoctorCandidates,
    resolveDoctorForPatient,
    checkDoctorShiftConstraint,
    analyzeIntentWithOllama,
    extractToolCalls
};
