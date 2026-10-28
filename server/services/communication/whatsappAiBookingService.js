const axios = require('axios');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const pendingBookingRepository = require('../../repositories/communication/pendingBookingRepository');
const availabilitySearchService = require('../appointments/availabilitySearchService');

/**
 * WhatsApp AI Booking Service
 * Listens to inbound patient WhatsApp messages, uses local Ollama (qwen2.5-coder:3b)
 * to detect booking intents with tools, and queues pending bookings for secretary approval.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 25000;

/**
 * Resolves the primary doctor for the patient (last attended or first available).
 */
async function resolveDoctorForPatient(patientId) {
    if (!patientId) return null;
    try {
        // 1. Try to find the doctor from their most recent appointment
        const lastAppointment = await appointmentRepository.findLastByPatientId(patientId);
        if (lastAppointment && lastAppointment.doctor_id) {
            return lastAppointment.doctor_id;
        }

        // 2. Fallback to the first active doctor in the system
        const firstDoctor = await doctorRepository.findFirst();
        if (firstDoctor && firstDoctor.id) {
            return firstDoctor.id;
        }
    } catch (err) {
        console.error('[AI Booking] Error resolving doctor for patient:', err.message);
    }
    return null;
}

/**
 * Calls Ollama with tool definitions to detect appointment intent and slots.
 */
async function analyzeIntentWithOllama(messageText, doctorId) {
    const tools = [
        {
            type: 'function',
            function: {
                name: 'buscar_turnos_disponibles',
                description: 'Busca el próximo turno disponible para el paciente con su médico.',
                parameters: {
                    type: 'object',
                    properties: {
                        doctor_id: { type: 'number', description: 'ID del médico' },
                        dias_adelante: { type: 'number', description: 'Cantidad de días hacia adelante para buscar disponibilidad' }
                    },
                    required: ['doctor_id']
                }
            }
        }
    ];

    const systemPrompt = 
        'Eres el asistente virtual del consultorio médico. ' +
        'Si el paciente en su mensaje solicita, pide, necesita o consulta por un turno médico, ' +
        'invoca la herramienta "buscar_turnos_disponibles". ' +
        `El ID del médico del paciente es ${doctorId}.`;

    const payload = {
        model: OLLAMA_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: messageText }
        ],
        tools,
        stream: false,
        options: {
            temperature: 0.0
        }
    };

    const res = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, payload, { timeout: OLLAMA_TIMEOUT_MS });
    return res.data?.message;
}

/**
 * Parses tool calls defensively from either message.tool_calls or JSON text.
 */
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
    } catch (err) {
        console.debug('[AI Booking] Response is not a single JSON object, attempting regex chunk extraction:', err.message);
    }

    const regex = /\{[^{}]*"name"\s*:\s*"buscar_turnos_disponibles"[^{}]*\}/g;
    const matches = clean.match(regex);
    if (matches) {
        return matches.map(m => {
            try {
                return JSON.parse(m);
            } catch (err) {
                console.warn('[AI Booking] Failed to parse matched tool call chunk:', err.message);
                return null;
            }
        }).filter(Boolean);
    }

    return [];
}

/**
 * Processes an inbound patient message. Non-blocking and failsafe.
 */
async function processInboundMessage({ sender, message, patientId, phone }) {
    if (!patientId || !message || typeof message !== 'string') {
        return null;
    }

    // 1. Guard against duplicate active pending bookings
    try {
        const active = await pendingBookingRepository.findActiveByPatient(patientId);
        if (active) {
            console.log(`[AI Booking] Patient ${patientId} already has an active pending booking. Skipping duplicate.`);
            return null;
        }
    } catch (err) {
        console.warn('[AI Booking] Could not check active pending bookings:', err.message);
    }

    // 2. Resolve Doctor
    const doctorId = await resolveDoctorForPatient(patientId);
    if (!doctorId) {
        console.log(`[AI Booking] No doctor found for patient ${patientId}.`);
        return null;
    }

    // 3. Ask Ollama with Tool Calling
    let responseMessage;
    try {
        responseMessage = await analyzeIntentWithOllama(message, doctorId);
    } catch (err) {
        console.warn(`[AI Booking] Ollama unreachable or error (${err.message}). Skipping AI queue creation.`);
        return null;
    }

    const toolCalls = extractToolCalls(responseMessage);
    const wantsBooking = toolCalls.some(tc => tc.name === 'buscar_turnos_disponibles');

    if (!wantsBooking) {
        return null; // Not an appointment request
    }

    // 4. Find the first available free slot using the real Stored Procedure
    try {
        const availability = await availabilitySearchService.getNextFreeSlot({
            doctor_id: doctorId,
            start_date: new Date(),
            include_out_of_hours: 'false'
        });

        const dayGroup = availability?.results?.[0];
        const firstSlot = dayGroup?.slots?.[0];

        if (!dayGroup?.date || !firstSlot?.time) {
            console.log(`[AI Booking] No free slots available for doctor ${doctorId}.`);
            return null;
        }

        // 5. Create pending booking in DB (Supervised queue for the secretary)
        const pendingId = await pendingBookingRepository.create({
            patient_id: patientId,
            doctor_id: doctorId,
            patient_phone: phone,
            patient_message: message,
            requested_slot_date: dayGroup.date,
            requested_slot_time: firstSlot.time
        });

        console.log(`[AI Booking] ✅ Created pending booking #${pendingId} for patient ${patientId} (Dr. ${doctorId}) on ${dayGroup.date} ${firstSlot.time}`);
        return { pendingId, date: dayGroup.date, time: firstSlot.time };
    } catch (err) {
        console.error('[AI Booking] Failed to create pending booking:', err.message);
        return null;
    }
}

module.exports = {
    processInboundMessage,
    resolveDoctorForPatient,
    analyzeIntentWithOllama,
    extractToolCalls
};
