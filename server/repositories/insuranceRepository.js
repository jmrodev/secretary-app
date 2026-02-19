const { pool } = require('../db');

/**
 * InsuranceRepository
 * Handles data access for insurances (obras sociales).
 */
class InsuranceRepository {
    async findAll(conn = pool) {
        return await conn.query("SELECT * FROM insurances ORDER BY name ASC");
    }

    async findById(id, conn = pool) {
        const rows = await conn.query("SELECT * FROM insurances WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async create(data, conn = pool) {
        const { name, cuit, website, email, phone, address, status, street_name, street_number, floor, apartment, city, province, country } = data;
        const result = await conn.query(
            `INSERT INTO insurances (name, cuit, website, email, phone, address, status, street_name, street_number, floor, apartment, city, province, country)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, cuit, website, email, phone, address, status || 'active',
                street_name || null, street_number || null, floor || null, apartment || null,
                city || 'Tandil', province || 'Buenos Aires', country || 'Argentina']
        );
        return result.insertId;
    }

    async update(id, updates, conn = pool) {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        return await conn.query(`UPDATE insurances SET ${fields} WHERE id = ?`, values);
    }

    async delete(id, conn = pool) {
        return await conn.query("DELETE FROM insurances WHERE id = ?", [id]);
    }
}

module.exports = new InsuranceRepository();
