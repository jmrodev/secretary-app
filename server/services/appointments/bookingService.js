const appointmentRepository = require('../../repositories/appointmentRepository');
const patientRepository = require('../../repositories/patientRepository');
const transactionRepository = require('../../repositories/transactionRepository');
const appointmentEvents = require('../../events/appointmentEvents');
const { calculatePrice } = require('../../utils/priceCalculator');
const { pool } = require('../../db');
const { ConflictError, NotFoundError } = require('../../utils/errors');
const { formatLocalSQL } = require('../../utils/dateUtils');

class BookingService {
    async createAppointment(userId, role, data) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            let patient_id = data.patient_id;
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
                    type: data.type,
                    institution_id: finalInstitutionId,
                    bonified: data.bonified === true || data.bonified === 1 || data.bonified === 'true',
                    created_by: userId
                }, conn);
            } catch (spErr) {
                if (spErr.message === 'slot_already_taken') {
                    throw new ConflictError("Ya existe un turno confirmado en este horario.");
                }
                throw spErr;
            }

            let paymentStatus = 'pending';
            if (!data.bonified) {
                paymentStatus = await this.generateDebt(appointmentId, data.doctor_id, patient_id, data.type, finalInstitutionId, patientData, conn, userId);
            }

            await conn.commit();

            // EMIT EVENT
            appointmentEvents.emit('appointmentCreated', {
                appointmentId,
                data,
                patientData,
                paymentStatus,
                userId
            });

            return { id: appointmentId, patientId };
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

    async generateDebt(appointmentId, doctorId, patientId, type, institutionId, patientData, conn, userId) {
        const serviceType = type === 'virtual' ? 'virtual_consultation' : 'consultation';
        const priceInfo = await calculatePrice(conn, doctorId, patientId, serviceType, institutionId);

        const patientShare = priceInfo.price;
        const basePrice = priceInfo.basePrice || patientShare;
        const institutionDebt = institutionId ? Math.max(0, basePrice - patientShare) : 0;

        const financeService = require('../finance/financeService');

        if (patientShare > 0) {
            await financeService.createTransaction({
                type: 'income_patient',
                amount: 0,
                debt_amount: patientShare,
                description: `${type === 'virtual' ? 'Virtual' : 'Presencial'} Share: ${patientData.full_name}`,
                related_user_id: patientData.user_id,
                doctor_id: doctorId,
                appointment_id: appointmentId,
                status: 'pending'
            }, userId, conn);
        }

        if (institutionDebt > 0 && institutionId) {
            await financeService.createTransaction({
                type: 'income_patient',
                amount: 0,
                debt_amount: institutionDebt,
                description: `${type === 'virtual' ? 'Virtual' : 'Presencial'} Institution Share: ${patientData.full_name}`,
                doctor_id: doctorId,
                institution_id: institutionId,
                appointment_id: appointmentId,
                status: 'pending'
            }, userId, conn);
        }

        return 'pending';
    }
}

module.exports = new BookingService();
