const patientRepository = require('../repositories/patientRepository');
const phoneModel = require('../models/PhoneModel');
const appointmentModel = require('../models/AppointmentModel');
const googleContactService = require('../services/google/GoogleContactService');
const { pool } = require('../db');
const { PatientsQueryBuilder } = require('../utils/queryBuilders');

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
                const phoneMap = await phoneModel.findByEntities('patient', rows.map(r => r.id));
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

        const appointments = await appointmentModel.findByPatientId(id);
        const [stats] = await appointmentModel.getStats(id);

        const conn = await pool.getConnection();
        try {
            const prescriptions = await conn.query(`
                (SELECT p.id, p.created_at, 'prescription' as type, d.full_name as doctor_name, p.medications as diagnosis, NULL as days
                 FROM prescriptions p JOIN appointments a ON p.appointment_id = a.id JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = ?)
                UNION
                (SELECT ml.id, ml.created_at, 'license' as type, d.full_name as doctor_name, ml.diagnosis, ml.days_duration as days
                 FROM medical_licenses ml JOIN appointments a ON ml.appointment_id = a.id JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = ?)
                ORDER BY created_at DESC`, [id, id]);

            const files = await conn.query(`
                SELECT f.*, u.username as uploader_name FROM patient_files f JOIN users u ON f.uploaded_by = u.id WHERE f.patient_id = ? ORDER BY f.created_at DESC`, [id]);

            const assignedDoctors = await conn.query(`
                SELECT d.id, d.full_name FROM patient_doctors pd JOIN doctors d ON pd.doctor_id = d.id WHERE pd.patient_id = ?`, [id]);

            const phoneNumbers = await phoneModel.findByEntity('patient', id);

            return {
                ...patient,
                total_debt: Number(patient.total_debt || 0), // Use total_debt from repository if included, or calculate
                appointments,
                prescriptions,
                files,
                accumulated_days: Number(stats.attended),
                assignedDoctors,
                phoneNumbers,
                stats
            };
        } finally {
            conn.release();
        }
    }

    async updatePatientDetails(id, updates, reqUser) {
        const { assignedDoctors, phoneNumbers, ...patientUpdates } = updates;
        const oldData = await patientRepository.findById(id);

        if (Object.keys(patientUpdates).length > 0) {
            await patientRepository.update(id, patientUpdates);
        }

        if (assignedDoctors !== undefined) {
            const conn = await pool.getConnection();
            try {
                await conn.query("DELETE FROM patient_doctors WHERE patient_id = ?", [id]);
                if (assignedDoctors?.length > 0) {
                    const insertValues = assignedDoctors.map(docId => [id, docId]);
                    await conn.batch("INSERT INTO patient_doctors (patient_id, doctor_id) VALUES (?, ?)", insertValues);
                }
            } finally { conn.release(); }
        }

        if (phoneNumbers !== undefined) {
            const primaryPhone = await phoneModel.syncPhones('patient', id, phoneNumbers);
            if (primaryPhone) await patientRepository.update(id, { phone: primaryPhone });
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
