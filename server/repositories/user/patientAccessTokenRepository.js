const { pool } = require('../../db');

/**
 * PatientAccessTokenRepository
 * Handles data access for patient temporary access tokens.
 */
class PatientAccessTokenRepository {
    async create(data, conn = pool) {
        const { token, patient_id, expires_at } = data;
        return await conn.query(
            "INSERT INTO patient_access_tokens (token, patient_id, expires_at) VALUES (?, ?, ?)",
            [token, patient_id || null, expires_at]
        );
    }

    async findActiveByToken(token, conn = pool) {
        const rows = await conn.query(
            "SELECT * FROM patient_access_tokens WHERE token = ? AND expires_at > NOW()",
            [token]
        );
        return rows[0] || null;
    }

    async delete(id, conn = pool) {
        return await conn.query("DELETE FROM patient_access_tokens WHERE id = ?", [id]);
    }
}

module.exports = new PatientAccessTokenRepository();
