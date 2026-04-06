async update(id, updates, conn) {
        if (!updates || Object.keys(updates).length === 0) return 0;
        const connection = conn || await pool.getConnection();
        try {
            const { setClauses, values: updateValues } = buildUpdateQuery('medical_requests', updates);
            if (!setClauses) return 0;
            const values = [...updateValues, id];
            const result = await connection.query(`UPDATE medical_requests SET ${setClauses} WHERE id = ?`, values);
            return result.affectedRows;
        } finally {async create(data, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const { columns, placeholders, values } = buildInsertQuery('medical_requests', data);
            if (!columns) throw new Error('No valid columns provided for medical_requests create');
            const result = await connection.query(`INSERT INTO medical_requests (${columns}) VALUES (${placeholders})`, values);
            return result.insertId;
        } finally {async update(id, updates, conn) {
        if (!updates || Object.keys(updates).length === 0) return 0;
        const connection = conn || await pool.getConnection();
        try {
            const { setClauses, values: updateValues } = buildUpdateQuery('medical_requests', updates);
            if (!setClauses) return 0;
            const values = [...updateValues, id];
            const result = await connection.query(`UPDATE medical_requests SET ${setClauses} WHERE id = ?`, values);
            return result.affectedRows;
        } finally {async create(data, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const { columns, placeholders, values } = buildInsertQuery('medical_requests', data);
            if (!columns) throw new Error('No valid columns provided for medical_requests create');
            const result = await connection.query(`INSERT INTO medical_requests (${columns}) VALUES (${placeholders})`, values);
            return result.insertId;
        } finally {async update(id, updates, conn) {
        if (!updates || Object.keys(updates).length === 0) return 0;
        const connection = conn || await pool.getConnection();
        try {
            const { setClauses, values: updateValues } = buildUpdateQuery('medical_requests', updates);
            if (!setClauses) return 0;
            const values = [...updateValues, id];
            const result = await connection.query(`UPDATE medical_requests SET ${setClauses} WHERE id = ?`, values);
            return result.affectedRows;
        } finally {async create(data, conn) {
        const connection = conn || await pool.getConnection();
        try {
            const { columns, placeholders, values } = buildInsertQuery('medical_requests', data);
            if (!columns) throw new Error('No valid columns provided for medical_requests create');
            const result = await connection.query(`INSERT INTO medical_requests (${columns}) VALUES (${placeholders})`, values);
            return result.insertId;
        } finally {const { pool } = require('../db');
const { buildUpdateQuery, buildInsertQuery } = require('../utils/sqlUtils');

/**
 * MedicalRequestRepository
 * Handles data access for medical requests (certificates, requests, etc).
 */
class MedicalRequestRepository {
    async findAll(filters = {}, conn = pool) {
        let query = `
            SELECT r.*, p.full_name as patient_name, p.user_id as patient_user_id, d.full_name as doctor_name, d.user_id as doctor_user_id,
            COALESCE(NULLIF(r.debt_amount, 0), 0) as resolved_debt_amount
            FROM medical_requests r
            LEFT JOIN patients p ON r.patient_id = p.id
            LEFT JOIN doctors d ON r.doctor_id = d.id
        `;
        const params = [];
        const whereClauses = [];

        if (filters.patientId) { whereClauses.push("r.patient_id = ?"); params.push(filters.patientId); }
        if (filters.doctorId) {
            // Include requests assigned to this doctor OR unassigned patient-submitted requests
            whereClauses.push("(r.doctor_id = ? OR (r.is_patient_submitted = TRUE AND r.doctor_id IS NULL))");
            params.push(filters.doctorId);
        }
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                whereClauses.push(`r.status IN (${filters.status.map(() => '?').join(',')})`);
                params.push(...filters.status);
            } else {
                whereClauses.push("r.status = ?");
                params.push(filters.status);
            }
        }

        if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
        query += " ORDER BY r.created_at DESC";

        if (filters.limit) {
            query += " LIMIT ? OFFSET ?";
            params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
        }

        return await conn.query(query, params);
    }

    async countAll(filters = {}, conn = pool) {
        let query = "SELECT COUNT(*) as total FROM medical_requests r";
        const params = [];
        const whereClauses = [];

        if (filters.patientId) { whereClauses.push("r.patient_id = ?"); params.push(filters.patientId); }
        if (filters.doctorId) {
            whereClauses.push("(r.doctor_id = ? OR (r.is_patient_submitted = TRUE AND r.doctor_id IS NULL))");
            params.push(filters.doctorId);
        }
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                whereClauses.push(`r.status IN (${filters.status.map(() => '?').join(',')})`);
                params.push(...filters.status);
            } else {
                whereClauses.push("r.status = ?");
                params.push(filters.status);
            }
        }

        if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
        const [row] = await conn.query(query, params);
        return row?.total || 0;
    }

    async findById(id, conn = pool) {
        const rows = await conn.query("SELECT * FROM medical_requests WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async findDetailedById(id, conn = pool) {
        const rows = await conn.query(`
            SELECT r.*, p.full_name as patient_name, p.user_id as patient_user_id, d.full_name as doctor_name, d.user_id as doctor_user_id
            FROM medical_requests r
            JOIN patients p ON r.patient_id = p.id
            JOIN doctors d ON r.doctor_id = d.id
            WHERE r.id = ?
        `, [id]);
        return rows[0] || null;
    }

    async create(data, conn = pool) {
        const { columns, placeholders, values } = buildInsertQuery('medical_requests', data);
        if (!columns) throw new Error('No valid columns provided for medical_requests create');
        const result = await conn.query(`INSERT INTO medical_requests (${columns}) VALUES (${placeholders})`, values);
        return result.insertId;
    }

    async update(id, updates, conn = pool) {
        if (!updates || Object.keys(updates).length === 0) return 0;
        const { setClauses: fields, values: __updateValues } = buildUpdateQuery('medical_requests', updates);
        if (!fields) return 0;
        const values = [...__updateValues, id];
        return await conn.query(`UPDATE medical_requests SET ${fields} WHERE id = ?`, values);
    }

    async delete(id, conn = pool) {
        return await conn.query("DELETE FROM medical_requests WHERE id = ?", [id]);
    }

    async addItem(data, conn = pool) {
        const { columns, placeholders, values } = buildInsertQuery('medical_request_items', data);
        if (!columns) throw new Error('No valid columns provided for medical_request_items create');
        return await conn.query(`INSERT INTO medical_request_items (${columns}) VALUES (${placeholders})`, values);
    }

    async getRequestAggregates(type, dateColumn, dateValue, isExactDate, doctor_id, conn = pool) {
        const doctorFilter = doctor_id ? " AND r.doctor_id = ?" : "";
        const dateFilter = isExactDate ? `DATE(r.${dateColumn}) = ?` : `r.${dateColumn} >= ?`;
        const query = `
            SELECT 
                COUNT(DISTINCT r.id) as count,
                SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END) as paid,
                SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END) as debt,
                SUM(CASE WHEN r.payment_status = 'bonified' THEN 1 ELSE 0 END) as bonified
            FROM medical_requests r
            LEFT JOIN transactions t ON t.request_id = r.id
            WHERE r.type = ? AND ${dateFilter}
            AND r.status != 'rejected'
            ${doctorFilter}
        `;
        const params = [type, dateValue];
        if (doctor_id) params.push(doctor_id);

        const [row] = await conn.query(query, params);
        return row || { count: 0, paid: 0, debt: 0 };
    }
}

module.exports = new MedicalRequestRepository();
