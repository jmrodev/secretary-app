const { pool } = require('../db');

/**
 * PatientRepository
 * Core data access for patients.
 */
class PatientRepository {
static ALLOWED_FIELDS = [
    'user_id', 'first_name', 'last_name', 'full_name', 'dob', 'phone', 'email',
    'medical_history', 'dni', 'affiliate_number', 'insurance_id', 'tariff_percent',
    'tariff_override', 'behavior_rating', 'is_new_patient', 'marked_new_at',
    'visit_interval_days', 'prescription_interval_days', 'next_suggested_visit_date',
    'next_suggested_prescription_date', 'license_expiry_date', 'institution_id',
    'street_name', 'street_number', 'floor', 'apartment', 'city', 'province',
    'country', 'visit_notified', 'prescription_notified', 'license_notified'
];

    async findById(id, conn = pool) {
        const rows = await conn.query(`
            SELECT 
                p.*,
                p.total_debt_calculated as total_debt,
                i.name as insurance_name, 
                inst.name as institution_name
            FROM view_patients_extended p
            LEFT JOIN insurances i ON p.insurance_id = i.id 
            LEFT JOIN institutions inst ON p.institution_id = inst.id 
            WHERE p.id = ?`, [id]);
        return rows[0] || null;
    }


    async findTariffAndInstitutionPrice(patientId, appointmentInstitutionId, conn = pool) {
        let query;
        let params;

        if (appointmentInstitutionId === null) {
            // Explicitly NO institution
            query = `SELECT tariff_percent, tariff_override, NULL as inst_price FROM patients WHERE id = ?`;
            params = [patientId];
        } else if (appointmentInstitutionId) {
            // Specific institution provided
            query = `
                SELECT p.tariff_percent, p.tariff_override, i.base_price as inst_price 
                FROM patients p
                LEFT JOIN institutions i ON i.id = ?
                WHERE p.id = ?
            `;
            params = [appointmentInstitutionId, patientId];
        } else {
            // Default: use patient's assigned institution
            query = `
                SELECT p.tariff_percent, p.tariff_override, i.base_price as inst_price 
                FROM patients p
                LEFT JOIN institutions i ON p.institution_id = i.id
                WHERE p.id = ?
            `;
            params = [patientId];
        }

        const rows = await conn.query(query, params);
        return rows[0] || null;
    }

    async findByUserId(userId, conn = pool) {
        const rows = await conn.query("SELECT * FROM patients WHERE user_id = ?", [userId]);
        return rows[0] || null;
    }

    async findUserIdById(id, conn = pool) {
        const rows = await conn.query("SELECT user_id FROM patients WHERE id = ?", [id]);
        return rows[0]?.user_id || null;
    }

    async findByFullName(fullName, conn = pool) {
        const rows = await conn.query("SELECT * FROM patients WHERE full_name = ?", [fullName]);
        return rows[0] || null;
    }

    async findByDni(dni, conn = pool) {
        const rows = await conn.query("SELECT * FROM patients WHERE dni = ?", [dni]);
        return rows[0] || null;
    }

    async findByFuzzyName(name, conn = pool) {
        const rows = await conn.query(
            "SELECT id FROM patients WHERE LOWER(TRIM(REGEXP_REPLACE(full_name, '[[:space:]]+', ' '))) = LOWER(TRIM(REGEXP_REPLACE(?, '[[:space:]]+', ' ')))",
            [name]
        );
        return rows[0] || null;
    }

    async findByNameLike(name, conn = pool) {
        const rows = await conn.query(
            "SELECT id FROM patients WHERE full_name LIKE ?",
            [`%${name}%`]
        );
        return rows[0] || null;
    }

    async create(data, conn = pool) {
        const filteredData = Object.keys(data)
            .filter(key => PatientRepository.ALLOWED_FIELDS.includes(key))
            .reduce((obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {});

        if (Object.keys(filteredData).length === 0) {
            throw new Error('No valid fields provided for creation');
        }

        const fields = Object.keys(filteredData).join(', ');
        const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
        const values = Object.values(filteredData);
        const result = await conn.query(`INSERT INTO patients (${fields}) VALUES (${placeholders})`, values);
        return Number(result.insertId);
    }

    async update(id, updates, conn = pool) {
        const filteredUpdates = Object.keys(updates)
            .filter(key => PatientRepository.ALLOWED_FIELDS.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        if (Object.keys(filteredUpdates).length === 0) {
            return { affectedRows: 0 }; // Nothing to update
        }

        const fields = Object.keys(filteredUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(filteredUpdates).map(v => v === '' ? null : v), id];
        return await conn.query(`UPDATE patients SET ${fields} WHERE id = ?`, values);
    }

    async getDebt(userId, conn = pool) {
        const rows = await conn.query(`
            SELECT COALESCE(SUM(t.amount), 0) as total_debt 
            FROM transactions t 
            LEFT JOIN appointments a ON t.appointment_id = a.id 
            WHERE t.related_user_id = ? 
            AND t.status = 'pending' 
            AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent'))
        `, [userId]);
        return rows[0]?.total_debt || 0;
    }

    async updateLicenseInfo(id, expiryDate, conn = pool) {
        return await conn.query("UPDATE patients SET license_expiry_date = ?, license_notified = 0 WHERE id = ?", [expiryDate, id]);
    }

    async updatePrescriptionInfo(id, nextDate, conn = pool) {
        return await conn.query("UPDATE patients SET next_suggested_prescription_date = ?, prescription_notified = 0 WHERE id = ?", [nextDate, id]);
    }

    async getPrescriptionInterval(patientId, doctorId, conn = pool) {
        const rows = await conn.query("SELECT prescription_interval_days FROM patient_doctors WHERE patient_id = ? AND doctor_id = ?", [patientId, doctorId]);
        return rows[0] || null;
    }

    async getNewPatientStats(conn = pool) {
        const [stats] = await conn.query(`
            SELECT COUNT(*) as total_new,
                   COUNT(CASE WHEN DATE(u.created_at) = CURDATE() THEN 1 END) as current_day,
                   COUNT(CASE WHEN YEARWEEK(u.created_at, 1) = YEARWEEK(NOW(), 1) THEN 1 END) as current_week,
                   COUNT(CASE WHEN MONTH(u.created_at) = MONTH(NOW()) AND YEAR(u.created_at) = YEAR(NOW()) THEN 1 END) as current_month,
                   COUNT(CASE WHEN YEAR(u.created_at) = YEAR(NOW()) THEN 1 END) as current_year,
                   COUNT(CASE WHEN YEAR(u.created_at) = YEAR(NOW()) - 1 THEN 1 END) as last_year
            FROM patients p JOIN users u ON p.user_id = u.id WHERE p.is_new_patient = 1
        `);
        return stats;
    }

    async findAdminPasswordHash(conn = pool) {
        const rows = await conn.query("SELECT password_hash FROM users WHERE username = 'admin'");
        return rows[0] || null;
    }

    async findRecentMedications(patientId, conn = pool) {
        return await conn.query(`
            SELECT medications as name FROM prescriptions pr 
            JOIN appointments a ON pr.appointment_id = a.id 
            WHERE a.patient_id = ?
            UNION
            SELECT medication_name as name FROM patient_medications 
            WHERE patient_id = ?
        `, [patientId, patientId]);
    }

    async getAssignedDoctors(patientId, conn = pool) {
        return await conn.query(`
            SELECT d.id, d.full_name 
            FROM patient_doctors pd 
            JOIN doctors d ON pd.doctor_id = d.id 
            WHERE pd.patient_id = ?`, [patientId]);
    }

    async updateAssignedDoctors(patientId, doctorIds, conn = pool) {
        await conn.query("DELETE FROM patient_doctors WHERE patient_id = ?", [patientId]);
        if (doctorIds && doctorIds.length > 0) {
            const insertValues = doctorIds.map(docId => [patientId, docId]);
            await conn.batch("INSERT INTO patient_doctors (patient_id, doctor_id) VALUES (?, ?)", insertValues);
        }
    }

    async getHistoryFull(patientId, conn = pool) {
        return await conn.query(`
            (SELECT p.id, p.created_at, 'prescription' as type, d.full_name as doctor_name, p.medications as diagnosis, NULL as days
             FROM prescriptions p JOIN appointments a ON p.appointment_id = a.id JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = ?)
            UNION
            (SELECT ml.id, ml.created_at, 'license' as type, d.full_name as doctor_name, ml.diagnosis, ml.days_duration as days
             FROM medical_licenses ml JOIN appointments a ON ml.appointment_id = a.id JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = ?)
            ORDER BY created_at DESC`, [patientId, patientId]);
    }
}

module.exports = new PatientRepository();
