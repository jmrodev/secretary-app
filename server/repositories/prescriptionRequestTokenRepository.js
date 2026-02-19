const { pool } = require('../db');

/**
 * PrescriptionRequestTokenRepository
 * Handles data access for public prescription request tokens.
 */
class PrescriptionRequestTokenRepository {
    async create(data, conn = pool) {
        const { patient_id, doctor_id, token, expires_at } = data;
        return await conn.query(
            "INSERT INTO prescription_request_tokens (patient_id, doctor_id, token, expires_at) VALUES (?, ?, ?, ?)",
            [patient_id, doctor_id, token, expires_at]
        );
    }

    async findActiveByToken(token, conn = pool) {
        const rows = await conn.query(
            "SELECT * FROM prescription_request_tokens WHERE token = ? AND expires_at > NOW() AND used = FALSE",
            [token]
        );
        return rows[0] || null;
    }

    async markAsUsed(tokenId, conn = pool) {
        return await conn.query("UPDATE prescription_request_tokens SET used = TRUE WHERE id = ?", [tokenId]);
    }
}

module.exports = new PrescriptionRequestTokenRepository();
