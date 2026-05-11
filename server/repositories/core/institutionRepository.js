const { pool } = require('../../db');

/**
 * InstitutionRepository
 * Handles data access for medical institutions.
 */
const ALLOWED_UPDATES = [
    'name', 'description', 'status', 'base_price'
];

class InstitutionRepository {
    async findAll(conn = pool) {
        return await conn.query(`
            SELECT i.*, 
                   COALESCE((
                       SELECT SUM(
                           CASE 
                               WHEN t.type = 'income_institution' AND t.status = 'paid' THEN -t.amount
                               ELSE t.amount 
                           END
                       ) 
                       FROM transactions t 
                       LEFT JOIN appointments a ON t.appointment_id = a.id
                       WHERE t.institution_id = i.id 
                       AND (
                           (t.status = 'pending' AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent')))
                           OR (t.type = 'income_institution' AND t.status = 'paid')
                       )
                   ), 0) as total_debt,
                   COALESCE((
                       SELECT COUNT(*)
                       FROM transactions t
                       LEFT JOIN appointments a ON t.appointment_id = a.id
                       WHERE t.institution_id = i.id
                       AND t.status = 'pending'
                       AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent'))
                   ), 0) as pending_count
            FROM institutions i ORDER BY i.name ASC
        `);
    }

    async findById(id, conn = pool) {
        const rows = await conn.query("SELECT * FROM institutions WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async create(data, conn = pool) {
        const { name, description, status, base_price } = data;
        const result = await conn.query(
            "INSERT INTO institutions (name, description, status, base_price) VALUES (?, ?, ?, ?)",
            [name, description, status || 'active', base_price || 0]
        );
        return result.insertId;
    }

    async update(id, updates, conn = pool) {
        if (!updates || Object.keys(updates).length === 0) return 0;

        // Filter updates to only allow whitelisted fields
        const validUpdates = {};
        for (const key of Object.keys(updates)) {
            if (ALLOWED_UPDATES.includes(key)) {
                validUpdates[key] = updates[key];
            }
        }

        if (Object.keys(validUpdates).length === 0) return 0;

        const fields = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(validUpdates), id];
        return await conn.query(`UPDATE institutions SET ${fields} WHERE id = ?`, values);
    }

    async delete(id, conn = pool) {
        return await conn.query("DELETE FROM institutions WHERE id = ?", [id]);
    }

    async getInstitutionFinances(institutionId, conn = pool) {
        return await conn.query(`
            SELECT t.id as transaction_id, t.amount, t.description, t.transaction_date, t.status as payment_status, t.method,
                   p.full_name as patient_name, d.full_name as doctor_name, a.id as appointment_id, a.appointment_date, a.status as appointment_status
            FROM transactions t
            LEFT JOIN appointments a ON t.appointment_id = a.id
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON t.doctor_id = d.id
            WHERE t.institution_id = ? ORDER BY t.transaction_date DESC
        `, [institutionId]);
    }

    async getPatientList(institutionId, conn = pool) {
        return await conn.query(`
            SELECT p.id, p.full_name, p.dni, p.next_suggested_visit_date, p.tariff_percent, p.tariff_override,
                   (SELECT MAX(appointment_date) FROM appointments WHERE patient_id = p.id AND status = 'completed') as last_visit_date
            FROM patients p WHERE p.institution_id = ? ORDER BY p.full_name ASC
        `, [institutionId]);
    }
}

module.exports = new InstitutionRepository();
