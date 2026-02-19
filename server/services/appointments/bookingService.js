const appointmentRepository = require('../../repositories/appointmentRepository');
const patientRepository = require('../../repositories/patientRepository');
const transactionRepository = require('../../repositories/transactionRepository');
const appointmentEvents = require('../../events/appointmentEvents');
const { calculatePrice } = require('../../utils/priceCalculator');
const { pool } = require('../../db');
const { ConflictError, NotFoundError } = require('../../utils/errors');

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

            const formattedDate = new Date(data.appointment_date).toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace('T', ' ');

            await appointmentRepository.deleteFromRecentlyFreedSlots(data.doctor_id, formattedDate, conn);

            const existing = await appointmentRepository.findBySlot(data.doctor_id, formattedDate, conn);
            if (existing.length > 0) {
                const oldAppt = existing[0];
                if (!['reserved', 'cancelled', 'absent'].includes(oldAppt.status)) {
                    throw new ConflictError("Ya existe un turno confirmado en este horario.");
                }
                if (oldAppt.status === 'reserved') {
                    await this.handleOverwrite(oldAppt, data, userId, conn);
                }
            }

            const patientData = await patientRepository.findById(patient_id, conn);
            let finalInstitutionId = data.institution_id === 'none' ? null : (data.institution_id || (patientData ? patientData.institution_id : null));

            const appointmentId = await appointmentRepository.create({
                patient_id,
                doctor_id: data.doctor_id,
                appointment_date: formattedDate,
                reason: data.reason,
                is_out_of_hours: data.is_out_of_hours === true || data.is_out_of_hours === 1 || data.is_out_of_hours === 'true',
                type: data.type,
                status: 'pending',
                institution_id: finalInstitutionId
            }, conn);

            let paymentStatus = 'pending';
            if (!data.bonified) {
                paymentStatus = await this.generateDebt(appointmentId, data.doctor_id, patient_id, data.type, finalInstitutionId, patientData, conn);
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
    }

    async generateDebt(appointmentId, doctorId, patientId, type, institutionId, patientData, conn) {
        const serviceType = type === 'virtual' ? 'virtual_consultation' : 'consultation';
        const priceInfo = await calculatePrice(conn, doctorId, patientId, serviceType, institutionId);

        const patientShare = priceInfo.price;
        const basePrice = priceInfo.basePrice || patientShare;
        const institutionDebt = institutionId ? Math.max(0, basePrice - patientShare) : 0;

        if (patientShare > 0) {
            await transactionRepository.create({
                type: 'income_patient',
                amount: patientShare,
                description: `${type === 'virtual' ? 'Virtual' : 'Presencial'} Share: ${patientData.full_name}`,
                related_user_id: patientData.user_id,
                doctor_id: doctorId,
                method: 'on_account',
                status: 'pending',
                transaction_date: new Date(),
                appointment_id: appointmentId
            }, conn);
        }
        if (institutionDebt > 0 && institutionId) {
            await transactionRepository.create({
                type: 'income_patient',
                amount: institutionDebt,
                description: `${type === 'virtual' ? 'Virtual' : 'Presencial'} Institution Share: ${patientData.full_name}`,
                doctor_id: doctorId,
                institution_id: institutionId,
                method: 'on_account',
                status: 'pending',
                transaction_date: new Date(),
                appointment_id: appointmentId
            }, conn);
        }

        if (patientShare > 0 || institutionDebt > 0) {
            await appointmentRepository.update(appointmentId, { payment_status: 'pending' }, conn);
            return 'pending';
        }
        return 'pending';
    }
}

module.exports = new BookingService();
