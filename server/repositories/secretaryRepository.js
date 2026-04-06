const { pool } = require('../db');
const { buildUpdateQuery } = require('../utils/sqlUtils');

/**
 * SecretaryRepository
 * Handles data access for secretaries.
 */
class SecretaryRepository {
    async create(data, conn = pool) {
        const { user_id, full_name, dni, phone } = data;
        const result = await conn.query(
            "INSERT INTO secretaries (user_id, full_name, dni, phone) VALUES (?, ?, ?, ?)",
            [user_id, full_name, dni, phone]
        );
        return Number(result.insertId);
    }

    async findById(id, conn = pool) {
        const rows = await conn.query("SELECT * FROM secretaries WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async findByUserId(userId, conn = pool) {
        const rows = await conn.query("SELECT * FROM secretaries WHERE user_id = ?", [userId]);
        return rows[0] || null;
    }

    async update(id, updates, conn = pool) {
        const { setClauses: fields, values: __updateValues } = buildUpdateQuery('secretaries', updates);
        if (!fields) return 0;
        const values = [...__updateValues, id];
        return await conn.query(`UPDATE secretaries SET ${fields} WHERE id = ?`, values);
    }

    async updateByUserId(userId, updates, conn = pool) {
        const { setClauses: fields, values: __updateValues } = buildUpdateQuery('secretaries', updates);
        if (!fields) return 0;
        const values = [...__updateValues, userId];
        return await conn.query(`UPDATE secretaries SET ${fields} WHERE user_id = ?`, values);
    }

    async delete(id, conn = pool) {
        return await conn.query("DELETE FROM secretaries WHERE id = ?", [id]);
    }
}

module.exports = new SecretaryRepository();
