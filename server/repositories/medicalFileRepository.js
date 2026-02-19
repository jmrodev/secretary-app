const { pool } = require('../db');

/**
 * MedicalFileRepository
 * Handles data access for patient files.
 */
class MedicalFileRepository {
    async create(data, conn = pool) {
        const { patient_id, uploaded_by, file_name, file_url, file_type, description } = data;
        return await conn.query(
            "INSERT INTO patient_files (patient_id, uploaded_by, file_name, file_url, file_type, description) VALUES (?, ?, ?, ?, ?, ?)",
            [patient_id, uploaded_by, file_name, file_url, file_type, description]
        );
    }

    async findById(id, conn = pool) {
        const rows = await conn.query("SELECT * FROM patient_files WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async findAll(filters = {}, conn = pool) {
        const { patient_id } = filters;
        let query = `
            SELECT f.*, u.username as uploader_name, p.full_name as patient_name, p.dni as patient_dni, p.address as patient_address
            FROM patient_files f
            JOIN users u ON f.uploaded_by = u.id
            JOIN patients p ON f.patient_id = p.id
        `;
        const params = [];
        if (patient_id) {
            query += " WHERE f.patient_id = ?";
            params.push(patient_id);
        }
        query += " ORDER BY f.created_at DESC";
        return await conn.query(query, params);
    }

    async delete(id, conn = pool) {
        return await conn.query("DELETE FROM patient_files WHERE id = ?", [id]);
    }
}

module.exports = new MedicalFileRepository();
