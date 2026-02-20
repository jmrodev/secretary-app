const { pool } = require('../db');

/**
 * MedicalRequestRepository
 * Handles data access for medical requests (certificates, requests, etc).
 */
class MedicalRequestRepository {
    async findAll(filters = {}, conn = pool) {
        let query = `
            SELECT r.*, p.full_name as patient_name, d.full_name as doctor_name,
            COALESCE(NULLIF(r.debt_amount, 0), (SELECT amount FROM transactions WHERE request_id = r.id AND status='pending' LIMIT 1), r.debt_amount) as resolved_debt_amount
            FROM medical_requests r
            LEFT JOIN patients p ON r.patient_id = p.id
            LEFT JOIN doctors d ON r.doctor_id = d.id
        `;
        const params = [];
        const whereClauses = [];

        if (filters.patientId) { whereClauses.push("r.patient_id = ?"); params.push(filters.patientId); }
        if (filters.doctorId) { whereClauses.push("r.doctor_id = ?"); params.push(filters.doctorId); }

        if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
        query += " ORDER BY r.created_at DESC";

        return await conn.query(query, params);
    }

    async findById(id, conn = pool) {
        const rows = await conn.query("SELECT * FROM medical_requests WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async findDetailedById(id, conn = pool) {
        const rows = await conn.query(`
            SELECT r.*, p.full_name as patient_name, d.full_name as doctor_name
            FROM medical_requests r
            JOIN patients p ON r.patient_id = p.id
            JOIN doctors d ON r.doctor_id = d.id
            WHERE r.id = ?
        `, [id]);
        return rows[0] || null;
    }

    async create(data, conn = pool) {
        const fields = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        const result = await conn.query(`INSERT INTO medical_requests (${fields}) VALUES (${placeholders})`, values);
        return result.insertId;
    }

    async update(id, updates, conn = pool) {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        return await conn.query(`UPDATE medical_requests SET ${fields} WHERE id = ?`, values);
    }

    async delete(id, conn = pool) {
        return await conn.query("DELETE FROM medical_requests WHERE id = ?", [id]);
    }

    async addItem(data, conn = pool) {
        const fields = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        return await conn.query(`INSERT INTO medical_request_items (${fields}) VALUES (${placeholders})`, values);
    }
}

module.exports = new MedicalRequestRepository();
