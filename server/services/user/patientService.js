const patientRepository = require('../../repositories/user/patientRepository');
const phoneRepository = require('../../repositories/system/phoneRepository');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const statsRepository = require('../../repositories/system/statsRepository');
const medicalRequestRepository = require('../../repositories/medical/medicalRequestRepository');
const medicalFileRepository = require('../../repositories/medical/medicalFileRepository');
const bcrypt = require('bcrypt');
const { pool } = require('../../db');
const { formatLocalSQL, formatDateOnlySQL, nowLocalSQL } = require('../../utils/core/dateUtils');

const { PATIENT_FIELDS } = require('../../constants/patientConstants');

/**
 * PatientService
 * Handles business logic for patient management.
 */
class PatientService {
    async getAllPatients(user, search, page = 1, limit = 50, doctor_id = null) {
        const { patients, totalCount } = await patientRepository.searchPatients({ search, page, limit, doctor_id }, user);
        
        // Enrich with phones (optional if not in SP)
        if (patients.length > 0) {
            const phoneMap = await phoneRepository.findByEntities('patient', patients.map(r => r.id));
            patients.forEach(r => { 
                r.phoneNumbers = phoneMap[r.id] || []; 
                r.total_debt = Number(r.total_debt_calculated || 0);
            });
        }

        return { patients, totalCount };
    }

    async getPatientDetails(id) {
        const patient = await patientRepository.findById(id);
        if (!patient) throw new Error("Patient not found");

        const appointments = await appointmentRepository.findByPatientId(id);
        const [stats] = await statsRepository.getPatientAppointmentStats(id);

        const prescriptions = await medicalRequestRepository.getPatientMedicalHistory(id);
        const files = await medicalFileRepository.findAll({ patient_id: id });
        const assignedDoctors = await patientRepository.getAssignedDoctors(id);
        const phoneNumbers = await phoneRepository.findByEntity('patient', id);

        return {
            ...patient,
            total_debt: Number(patient.total_debt_calculated || 0),
            appointments,
            prescriptions,
            files,
            accumulated_days: Number(stats.attended),
            assignedDoctors,
            phoneNumbers,
            stats
        };
    }

    async updatePatientDetails(id, updates, _reqUser) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { assignedDoctors, phoneNumbers, username, password, ...rest } = updates;
            const oldData = await patientRepository.findById(id, conn);

            // Filtrar solo los campos válidos de la tabla `patients`
            const patientUpdates = Object.fromEntries(
                Object.entries(rest).filter(([key]) => PATIENT_FIELDS.has(key))
            );

            // Saneamiento de fechas para MariaDB
            if (patientUpdates.dob) patientUpdates.dob = formatDateOnlySQL(patientUpdates.dob);
            if (patientUpdates.marked_new_at) patientUpdates.marked_new_at = formatLocalSQL(patientUpdates.marked_new_at);
            if (patientUpdates.license_expiry_date) patientUpdates.license_expiry_date = formatDateOnlySQL(patientUpdates.license_expiry_date);
            if (patientUpdates.next_suggested_visit_date) patientUpdates.next_suggested_visit_date = formatDateOnlySQL(patientUpdates.next_suggested_visit_date);
            if (patientUpdates.next_suggested_prescription_date) patientUpdates.next_suggested_prescription_date = formatDateOnlySQL(patientUpdates.next_suggested_prescription_date);

            if (Object.keys(patientUpdates).length > 0) {
                await patientRepository.update(id, patientUpdates, conn);
            }

            // Actualizar username/password en la tabla `users` si se proporcionaron
            if (username || password) {
                const userUpdates = {};
                if (username) userUpdates.username = username;
                if (password) userUpdates.password_hash = await bcrypt.hash(password, 10);
                await conn.query(
                    `UPDATE users SET ${Object.keys(userUpdates).map(k => `${k} = ?`).join(', ')} WHERE id = (SELECT user_id FROM patients WHERE id = ?)`,
                    [...Object.values(userUpdates), id]
                );
            }

            if (assignedDoctors !== undefined) {
                await patientRepository.updateAssignedDoctors(id, assignedDoctors, conn);
            }

            if (phoneNumbers !== undefined) {
                const primaryPhone = await phoneRepository.syncPhones('patient', id, phoneNumbers, conn);
                if (primaryPhone) await patientRepository.update(id, { phone: primaryPhone }, conn);
            } else if (rest.phone !== undefined && rest.phone !== null) {
                // Update the phone_numbers table safely to preserve secondary phones
                const existingPhones = await phoneRepository.findByEntity('patient', id, conn);

                if (existingPhones.length <= 1) {
                    const primaryPhone = await phoneRepository.syncPhones('patient', id, [{ phone_number: rest.phone, is_primary: 1, label: 'Celular' }], conn);
                    if (primaryPhone) await patientRepository.update(id, { phone: primaryPhone }, conn);
                } else {
                    const primaryDoc = existingPhones.find(p => p.is_primary === 1 || p.is_primary === true) || existingPhones[0];
                    await conn.query("UPDATE phone_numbers SET phone_number = ? WHERE id = ?", [rest.phone, primaryDoc.id]);
                    await patientRepository.update(id, { phone: rest.phone }, conn);
                }
            }

            await conn.commit();

            const newData = await patientRepository.findById(id);
            // Removed Google Contact Sync as requested (account is only for appointments)
            // googleContactService.syncContact(newData).catch(err => console.error("Sync Error:", err));

            return { oldData, newData };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async toggleNewPatientStatus(id) {
        const patient = await patientRepository.findById(id);
        if (!patient) throw new Error("Patient not found");

        const newStatus = !patient.is_new_patient;
        await patientRepository.update(id, {
            is_new_patient: newStatus ? 1 : 0,
            marked_new_at: newStatus ? nowLocalSQL() : null
        });
        return newStatus;
    }

    async getNewPatientStats() {
        const stats = await statsRepository.getNewPatientStats();
        return {
            current_new: Number(stats.total_new),
            currentDay: Number(stats.current_day),
            currentWeek: Number(stats.current_week),
            currentMonth: Number(stats.current_month),
            currentYear: Number(stats.current_year),
            lastYear: Number(stats.last_year)
        };
    }

    async getRecentPatients() {
        const [rows] = await pool.query('SELECT * FROM view_recent_patients');
        return rows;
    }

    async getSearchSuggestions(user) {
        const [rows] = await pool.query("CALL sp_get_search_suggestions(?, ?)", [user.user_id, user.role]);
        return rows[0] || [];
    }
}

module.exports = new PatientService();
