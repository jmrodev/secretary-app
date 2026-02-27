const patientRepository = require('../repositories/patientRepository');
const phoneRepository = require('../repositories/phoneRepository');
const appointmentRepository = require('../repositories/appointmentRepository');
const medicalFileRepository = require('../repositories/medicalFileRepository');
const googleContactService = require('../services/google/GoogleContactService');
const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { PatientsQueryBuilder } = require('../utils/queryBuilders');

const { PATIENT_FIELDS } = require('../constants/patientConstants');

/**
 * PatientService
 * Handles business logic for patient management.
 */
class PatientService {
    async getAllPatients(user, search) {
        const conn = await pool.getConnection();
        try {
            const builder = new PatientsQueryBuilder(user);
            await builder.applyRoleFilter();
            builder.withFullDetails().applySearch(search).sortByName();

            const { query, params } = builder.build();
            const rows = await conn.query(query, params);

            if (rows.length > 0) {
                const phoneMap = await phoneRepository.findByEntities('patient', rows.map(r => r.id), conn);
                rows.forEach(r => { r.phoneNumbers = phoneMap[r.id] || []; });
            }

            return rows.map(r => ({
                ...r,
                total_debt: Number(r.total_debt),
                total_appointments: Number(r.total_appointments),
                missed_appointments: Number(r.missed_appointments)
            }));
        } finally {
            conn.release();
        }
    }

    async getPatientDetails(id) {
        const patient = await patientRepository.findById(id);
        if (!patient) throw new Error("Patient not found");

        const appointments = await appointmentRepository.findByPatientId(id);
        const [stats] = await appointmentRepository.getStats(id);

        const prescriptions = await patientRepository.getHistoryFull(id);
        const files = await medicalFileRepository.findAll({ patient_id: id });
        const assignedDoctors = await patientRepository.getAssignedDoctors(id);
        const phoneNumbers = await phoneRepository.findByEntity('patient', id);

        return {
            ...patient,
            total_debt: Number(patient.total_debt || 0),
            appointments,
            prescriptions,
            files,
            accumulated_days: Number(stats.attended),
            assignedDoctors,
            phoneNumbers,
            stats
        };
    }

    async updatePatientDetails(id, updates, reqUser) {
        const { assignedDoctors, phoneNumbers, username, password, ...rest } = updates;
        const oldData = await patientRepository.findById(id);

        // Filtrar solo los campos válidos de la tabla `patients`
        // Evita errores SQL por campos extra del formData (insurance_name, id, etc.)
        const patientUpdates = Object.fromEntries(
            Object.entries(rest).filter(([key]) => PATIENT_FIELDS.has(key))
        );

        if (Object.keys(patientUpdates).length > 0) {
            await patientRepository.update(id, patientUpdates);
        }

        // Actualizar username/password en la tabla `users` si se proporcionaron
        if (username || password) {
            const userUpdates = {};
            if (username) userUpdates.username = username;
            if (password) userUpdates.password_hash = await bcrypt.hash(password, 10);
            const conn = await pool.getConnection();
            try {
                await conn.query(
                    `UPDATE users SET ${Object.keys(userUpdates).map(k => `${k} = ?`).join(', ')} WHERE id = (SELECT user_id FROM patients WHERE id = ?)`,
                    [...Object.values(userUpdates), id]
                );
            } finally {
                conn.release();
            }
        }

        if (assignedDoctors !== undefined) {
            await patientRepository.updateAssignedDoctors(id, assignedDoctors);
        }

        if (phoneNumbers !== undefined) {
            const primaryPhone = await phoneRepository.syncPhones('patient', id, phoneNumbers);
            if (primaryPhone) await patientRepository.update(id, { phone: primaryPhone });
        } else if (rest.phone !== undefined && rest.phone !== null) {
            // Update the phone_numbers table safely to preserve secondary phones
            const existingPhones = await phoneRepository.findByEntity('patient', id);

            if (existingPhones.length <= 1) {
                const primaryPhone = await phoneRepository.syncPhones('patient', id, [{ phone_number: rest.phone, is_primary: 1, label: 'Celular' }]);
                if (primaryPhone) await patientRepository.update(id, { phone: primaryPhone });
            } else {
                const primaryDoc = existingPhones.find(p => p.is_primary === 1 || p.is_primary === true) || existingPhones[0];
                const conn = await pool.getConnection(); // Use existing pool
                try {
                    await conn.query("UPDATE phone_numbers SET phone_number = ? WHERE id = ?", [rest.phone, primaryDoc.id]);
                } finally {
                    conn.release();
                }
                await patientRepository.update(id, { phone: rest.phone });
            }
        }

        const newData = await patientRepository.findById(id);
        googleContactService.syncContact(newData).catch(err => console.error("Sync Error:", err));

        return { oldData, newData };
    }

    async toggleNewPatientStatus(id) {
        const patient = await patientRepository.findById(id);
        if (!patient) throw new Error("Patient not found");

        const newStatus = !patient.is_new_patient;
        await patientRepository.update(id, {
            is_new_patient: newStatus ? 1 : 0,
            marked_new_at: newStatus ? new Date() : null
        });
        return newStatus;
    }

    async getNewPatientStats() {
        const stats = await patientRepository.getNewPatientStats();
        return {
            current_new: Number(stats.total_new),
            currentDay: Number(stats.current_day),
            currentWeek: Number(stats.current_week),
            currentMonth: Number(stats.current_month),
            currentYear: Number(stats.current_year),
            lastYear: Number(stats.last_year)
        };
    }
}

module.exports = new PatientService();
