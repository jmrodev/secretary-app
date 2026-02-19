const { pool } = require('../../db');
const googleCalendarService = require('./GoogleCalendarService');
const appointmentRepository = require('../../repositories/appointmentRepository');
const patientRepository = require('../../repositories/patientRepository');
const doctorRepository = require('../../repositories/doctorRepository');
const { TIMEZONE } = require('../../utils/dateUtils');

/**
 * GoogleCalendarAuditService
 * Handles legacy audit and sanitization logic between Google and Local DB.
 */
class GoogleCalendarAuditService {
    async getAuditData(query) {
        const { start_date, end_date, doctor_id } = query;
        const start = start_date ? new Date(start_date) : new Date();
        const end = end_date ? new Date(end_date) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

        const sqlStart = start.toISOString().split('T')[0] + ' 00:00:00';
        const sqlEnd = end.toISOString().split('T')[0] + ' 23:59:59';

        const localAppts = await appointmentRepository.findForAudit(sqlStart, sqlEnd, doctor_id);
        const doctorIds = [...new Set(localAppts.map(a => a.doctor_id))];
        if (doctor_id && !doctorIds.includes(parseInt(doctor_id))) {
            doctorIds.push(parseInt(doctor_id));
        }

        const googleEventsMap = {};
        for (const docId of doctorIds) {
            try {
                const { events } = await googleCalendarService.listEvents(docId, { start: start.toISOString(), end: end.toISOString() });
                googleEventsMap[docId] = events;
            } catch (e) {
                console.warn(`Audit Fetch Failed for Doc ${docId}:`, e.message);
            }
        }

        return localAppts.map(local => {
            const events = googleEventsMap[local.doctor_id] || [];
            let match = events.find(e => e.id === local.google_event_id);
            if (!match) {
                const localTime = new Date(local.appointment_date).getTime();
                match = events.find(e => {
                    const gTime = new Date(e.start.dateTime || e.start.date).getTime();
                    return (gTime >= localTime && gTime < (localTime + 60 * 60 * 1000));
                });
                if (match) local.suggested_match = true;
            }
            return {
                ...local,
                google_data: match ? {
                    id: match.id,
                    summary: match.summary,
                    description: match.description,
                    start: match.start.dateTime || match.start.date,
                    end: match.end.dateTime || match.end.date,
                    status: match.status
                } : null
            };
        });
    }

    async sanitizeAppointment(id, data, userId, req) {
        const conn = await pool.getConnection();
        try {
            const { patientName, patientDni, patientPhone, patientEmail, reason, status, paymentStatus, type } = data;
            const appt = await appointmentRepository.findById(id, conn);
            if (!appt) throw new Error("Appointment not found");

            await conn.beginTransaction();

            if (appt.patient_id) {
                await patientRepository.update(appt.patient_id, {
                    full_name: patientName,
                    dni: patientDni || null,
                    phone: patientPhone || null,
                    email: patientEmail || null
                }, conn);
            }

            await appointmentRepository.update(id, {
                reason,
                status,
                payment_status: paymentStatus,
                type
            }, conn);

            const doctorConfig = await doctorRepository.getDoctorConfig(appt.doctor_id, conn);
            const duration = doctorConfig?.appointment_duration || 60;
            const startTime = new Date(appt.appointment_date);
            const endTime = new Date(startTime.getTime() + duration * 60000);

            const desc = `Motivo: ${reason || 'Consulta'}\nPaciente: ${patientName} (DNI: ${patientDni || 'N/A'})\nTeléfono: ${patientPhone || 'N/A'}\nEmail: ${patientEmail || 'N/A'}\nTipo: ${type === 'virtual' ? 'VIRTUAL' : 'Presencial'}\nEstado: ${status}\nPago: ${paymentStatus}`;

            const payload = {
                summary: patientName,
                description: desc,
                status,
                paymentStatus,
                start: { dateTime: startTime.toISOString(), timeZone: TIMEZONE },
                end: { dateTime: endTime.toISOString(), timeZone: TIMEZONE }
            };

            if (appt.google_event_id) {
                await googleCalendarService.updateEventHelper(appt.doctor_id, appt.google_event_id, payload, userId, req);
            } else {
                const res = await googleCalendarService.createEventHelper(appt.doctor_id, payload, userId, req);
                if (res?.id) {
                    await appointmentRepository.update(id, { google_event_id: res.id }, conn);
                }
            }

            await conn.commit();
            return { message: "Sanitized successfully" };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}

module.exports = new GoogleCalendarAuditService();
