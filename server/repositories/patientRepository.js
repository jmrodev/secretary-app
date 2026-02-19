const { pool } = require('../db');

/**
 * PatientRepository
 * Core data access for patients.
 */
class PatientRepository {
    async findById(id, conn = pool) {
        const rows = await conn.query(`
            SELECT p.*, u.username, i.name as insurance_name, inst.name as institution_name
            FROM patients p 
            JOIN users u ON p.user_id = u.id
            LEFT JOIN insurances i ON p.insurance_id = i.id 
            LEFT JOIN institutions inst ON p.institution_id = inst.id 
            WHERE p.id = ?`, [id]);
        return rows[0] || null;
    }

    async findTariffAndInstitutionPrice(patientId, appointmentInstitutionId = null, conn = pool) {
        let query = `
            SELECT p.tariff_percent, p.tariff_override, i.base_price as inst_price 
            FROM patients p
            LEFT JOIN institutions i ON ${appointmentInstitutionId ? 'i.id = ?' : 'p.institution_id = i.id'}
            WHERE p.id = ?
        `;
        const params = appointmentInstitutionId ? [appointmentInstitutionId, patientId] : [patientId];
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
        const fields = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        const result = await conn.query(`INSERT INTO patients (${fields}) VALUES (${placeholders})`, values);
        return Number(result.insertId);
    }

    async update(id, updates, conn = pool) {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(updates).map(v => v === '' ? null : v), id];
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
}

module.exports = new PatientRepository();
