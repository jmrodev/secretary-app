const whatsappRepository = require('../../repositories/communication/whatsappRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const scheduleRepository = require('../../repositories/appointments/scheduleRepository');
const holidayRepository = require('../../repositories/appointments/holidayRepository');
const availabilitySearchService = require('../../services/appointments/availabilitySearchService');
const patientRepository = require('../../repositories/user/patientRepository');
const { pool } = require('../../db');

/**
 * WhatsAppAiService
 * Handles AI-powered features for WhatsApp communication, including suggestions.
 */
class WhatsAppAiService {
    async getAiSuggestion(patientId, doctorId, userId) {
        if (!patientId) throw new Error('patientId is required');

        const context = await this._buildContext(patientId, doctorId, userId);
        const prompt = this._buildPrompt(context);
        
        const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Configuración de IA incompleta (Falta GROQ_API_KEY).');

        const apiModel = context.doctor?.gemini_model || 'llama-3.3-70b-versatile';
        const url = 'https://api.groq.com/openai/v1/chat/completions';

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: apiModel.startsWith('gemini') ? 'llama-3.3-70b-versatile' : apiModel,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'Error en la API de Groq');

        const suggestion = result.choices?.[0]?.message?.content?.trim();
        if (!suggestion) throw new Error('Groq no devolvió ninguna sugerencia.');

        return suggestion;
    }

    async _buildContext(patientId, doctorId, userId) {
        let doctorContext = "Actuá como la secretaría de un consultorio médico. Sugerí una respuesta breve, profesional y amable en español (máximo 20 palabras).";
        let historyLimit = 3;
        let doctorName = "la Secretaría";
        let extraInfo = "";

        const doctor = doctorId ? await doctorRepository.findById(doctorId) : null;
        const patient = await patientRepository.findById(patientId);
        const patientName = patient ? patient.full_name : 'Paciente';
        const history = await whatsappRepository.getHistoryByPatient(patientId);

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

            doctorContext = doctorContext
                .replace(/{doctor_name}/g, doctorName)
                .replace(/{patient_name}/g, patientName)
                .replace(/{secretary_name}/g, secretaryName)
                .replace(/{horarios}/g, formattedSchedules || 'No configurados')
                .replace(/{feriados}/g, formattedHolidays || 'No hay feriados próximos')
                .replace(/{price}/g, doctor.consultation_price ?? 'A convenir')
                .replace(/{appointment_location}/g, doctor.office_number || 'Consultorio central')
                .replace(/{cbu}/g, doctor.cbu || '')
                .replace(/{alias}/g, doctor.alias || '')
                .replace(/{bio}/g, doctor.bio || '');

            const now = new Date();
            const freeSlotsData = await availabilitySearchService.getFreeSlotsBatch(doctorId, now.toISOString().split('T')[0], false);
            const formattedFreeSlots = freeSlotsData.results.slice(0, 7).map(day => {
                const times = day.slots.slice(0, 6).map(s => s.time).join(', ');
                return `${day.dayName}: ${times}${day.slots.length > 6 ? '...' : ''}`;
            }).join('\n');

            const currentDateTime = now.toLocaleString('es-AR', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });

            extraInfo = `
DATOS DE LA AGENDA REAL (USAR ESTO PARA TURNOS):
Fecha actual: ${currentDateTime}
Turnos DISPONIBLES (próximos 7 días):
${formattedFreeSlots || 'No hay turnos libres próximamente.'}

DATOS DEL DOCTOR:
- Especialidad: ${doctor.specialty || 'N/A'}
- Precio Consulta: ${doctor.consultation_price != null ? `$${doctor.consultation_price}` : 'A convenir'}
- Consultorio/Dirección: ${doctor.office_number || 'Consultorio central'}
- Pagos: ${doctor.alias || doctor.cbu || 'Consultar'}

REGLAS PARA LA IA:
1. NUNCA inventes horarios. Solo ofrece lo que ves en "Turnos DISPONIBLES".
2. Si un día no está en la lista, decí que está lleno.
3. Sé extremadamente breve (máximo 25 palabras).
`;
        }

        const lastMessages = history.slice(-historyLimit).map(m => `${m.direction === 'inbound' ? 'Paciente' : 'Secretaría'}: ${m.body}`).join('\n');

        return { doctor, doctorName, doctorContext, extraInfo, lastMessages };
    }

    _buildPrompt(ctx) {
        return `
Instrucciones del Consultorio: ${ctx.doctorContext}
Doctor/a a cargo: ${ctx.doctorName}
Información de Referencia del Doctor:
${ctx.extraInfo}

Basado en el historial de WhatsApp de abajo, sugerí una respuesta breve, profesional y amable. 
Si el paciente pregunta por precios o ubicación, usá la Información de Referencia de arriba.
Respondé SOLO con la sugerencia, sin explicaciones ni comillas.

Historial:
${ctx.lastMessages}

Respuesta sugerida:
`.trim();
    }
}

module.exports = new WhatsAppAiService();
