const appointmentRepository = require('../../repositories/appointmentRepository');
const appointmentEvents = require('../../events/appointmentEvents');
const { calculatePrice } = require('../../utils/priceCalculator');
const { pool } = require('../../db');
const { ConflictError, NotFoundError } = require('../../utils/errors');

class BookingService {
    async createAppointment(userId, role, data) {
        let conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            let patient_id = data.patient_id;
            if (role === 'patient') {
                const rows = await conn.query("SELECT id FROM patients WHERE user_id = ?", [userId]);
                if (rows.length === 0) throw new NotFoundError("Patient profile not found");
                patient_id = rows[0].id;
            }

            const formattedDate = new Date(data.appointment_date).toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace('T', ' ');

            await conn.query("DELETE FROM recently_freed_slots WHERE doctor_id = ? AND slot_date = ?", [data.doctor_id, formattedDate]);

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

            const [patientData] = await conn.query("SELECT full_name, user_id, dni, phone, email, institution_id FROM patients WHERE id = ?", [patient_id]);
            let finalInstitutionId = data.institution_id === 'none' ? null : (data.institution_id || (patientData ? patientData.institution_id : null));

            const appointmentId = await appointmentRepository.create({
                patient_id,
                doctor_id: data.doctor_id,
                appointment_date: formattedDate,
                reason: data.reason,
                type: data.type,
                status: 'pending',
                institution_id: finalInstitutionId
            }, conn);

            let paymentStatus = 'pending';
            if (!data.bonified) {
                paymentStatus = await this.generateDebt(appointmentId, data.doctor_id, patient_id, data.type, finalInstitutionId, patientData, conn);
            }

            await conn.commit();

            // EMIT EVENT - The service doesn't care HOW it's synced or HOW it's logged
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
        const [oldPatient] = await conn.query("SELECT full_name FROM patients WHERE id = ?", [oldAppt.patient_id]);
        const oldPatientName = oldPatient ? oldPatient.full_name : 'Paciente desconocido';

        await conn.query(
            "INSERT INTO overwritten_reservations (doctor_id, slot_date, patient_id, patient_name) VALUES (?, ?, ?, ?)",
            [oldAppt.doctor_id, oldAppt.appointment_date, oldAppt.patient_id, oldPatientName]
        );
        await appointmentRepository.delete(oldAppt.id, conn);

        // Note: The sync deletion could also be an event, but usually overwrite is synchronous enough
        // Or we could emit 'appointmentDeleted'
    }

    async generateDebt(appointmentId, doctorId, patientId, type, institutionId, patientData, conn) {
        const serviceType = type === 'virtual' ? 'virtual_consultation' : 'consultation';
        const priceInfo = await calculatePrice(conn, doctorId, patientId, serviceType, institutionId);

        const patientShare = priceInfo.price;
        const basePrice = priceInfo.basePrice || patientShare;
        const institutionDebt = institutionId ? Math.max(0, basePrice - patientShare) : 0;

        if (patientShare > 0) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date, appointment_id) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
                ['income_patient', patientShare, `${type === 'virtual' ? 'Virtual' : 'Presencial'} Share: ${patientData.full_name}`, patientData.user_id, doctorId, 'on_account', 'pending', appointmentId]
            );
        }
        if (institutionDebt > 0 && institutionId) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, institution_id, method, status, transaction_date, appointment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
                ['income_patient', institutionDebt, `${type === 'virtual' ? 'Virtual' : 'Presencial'} Institution Share: ${patientData.full_name}`, null, doctorId, institutionId, 'on_account', 'pending', appointmentId]
            );
        }

        if (patientShare > 0 || institutionDebt > 0) {
            await appointmentRepository.update(appointmentId, { payment_status: 'debt' }, conn);
            return 'debt';
        }
        return 'pending';
    }
}

module.exports = new BookingService();
