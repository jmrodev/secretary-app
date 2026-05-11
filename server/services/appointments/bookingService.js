const appointmentRepository = require('../../../repositories/appointments/appointmentRepository');
const patientRepository = require('../../../repositories/user/patientRepository');
const appointmentEvents = require('../../../events/appointmentEvents');
const { pool } = require('../../../db');
const { ConflictError, NotFoundError } = require('../../../utils/core/errors');
const { formatLocalSQL } = require('../../../utils/core/dateUtils');

class BookingService {
    async createAppointment(userId, role, data) {
        console.log("[BookingService] Incoming Data:", JSON.stringify(data, null, 2));
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            let patient_id = data.patient_id || data.patientId;
            if (role === 'patient') {
                const patient = await patientRepository.findByUserId(userId, conn);
                if (!patient) throw new NotFoundError("Patient profile not found");
                patient_id = patient.id;
            }

            const formattedDate = formatLocalSQL(data.appointment_date);

            const patientData = await patientRepository.findById(patient_id, conn);
            let finalInstitutionId = data.institution_id === 'none' ? null : (data.institution_id || (patientData ? patientData.institution_id : null));

            let appointmentId;
            try {
                appointmentId = await appointmentRepository.callSpBookAppointment({
                    patient_id,
                    doctor_id: data.doctor_id,
                    appointment_date: formattedDate,
                    reason: data.reason,
                    is_out_of_hours: data.is_out_of_hours === true || data.is_out_of_hours === 1 || data.is_out_of_hours === 'true',
                    type: data.type || 'consultation',
                    institution_id: finalInstitutionId,
                    bonified: data.bonified === true || data.bonified === 1 || data.bonified === 'true',
                    created_by: userId
                }, conn);
            } catch (spErr) {
                if (spErr.text === 'slot_already_taken' || spErr.message === 'slot_already_taken') {
                    throw new ConflictError("Ya existe un turno confirmado en este horario.");
                }
                throw spErr;
            }

            await conn.commit();

            // EMIT EVENT
            appointmentEvents.emit('appointmentCreated', {
                appointmentId,
                data,
                patientData,
                paymentStatus: 'pending',
                userId
            });

            return { id: appointmentId, patient_id };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async handleOverwrite(oldAppt, newData, userId, conn) {
        const oldPatient = await patientRepository.findById(oldAppt.patient_id, conn);
        const oldPatientName = oldPatient ? oldPatient.full_name : 'Paciente desconocido';

        await appointmentRepository.createOverwrittenReservation({
            doctor_id: oldAppt.doctor_id,
            slot_date: oldAppt.appointment_date,
            patient_id: oldAppt.patient_id,
            patient_name: oldPatientName
        }, conn);

        if (oldAppt.google_event_id) {
            try {
                const googleSyncService = require('./googleSyncService');
                await googleSyncService.syncDelete(oldAppt.id, oldAppt.doctor_id, oldAppt.google_event_id, userId);
            } catch (syncErr) {
                console.warn(`[handleOverwrite] Google Sync deletion failed: ${syncErr.message}`);
            }
        }

        await appointmentRepository.delete(oldAppt.id, conn);

        // EMIT OVERWRITE EVENT
        appointmentEvents.emit('appointmentOverwritten', {
            oldAppointment: oldAppt,
            oldPatientName,
            newUserId: userId,
            timestamp: new Date()
        });
    }
}

module.exports = new BookingService();
