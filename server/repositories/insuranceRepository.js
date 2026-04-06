const { pool } = require('../db');

/**
 * InsuranceRepository
 * Handles data access for insurances (obras sociales).
 */
const ALLOWED_UPDATES = [
    'name', 'cuit', 'website', 'email', 'phone',
    'address_notes', 'status', 'street_name', 'street_number',
    'floor', 'apartment', 'city', 'province', 'country'
];

class InsuranceRepository {
    async findAll(conn = pool) {
        return await conn.query("SELECT * FROM insurances ORDER BY name ASC");
    }

    async findById(id, conn = pool) {
        const rows = await conn.query("SELECT * FROM insurances WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async create(data, conn = pool) {
        const { name, cuit, website, email, phone, address_notes, status, street_name, street_number, floor, apartment, city, province, country } = data;
        const result = await conn.query(
            `INSERT INTO insurances (name, cuit, website, email, phone, address_notes, status, street_name, street_number, floor, apartment, city, province, country)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, cuit, website, email, phone, address_notes, status || 'active',
                street_name || null, street_number || null, floor || null, apartment || null,
                city || 'Tandil', province || 'Buenos Aires', country || 'Argentina']
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
        return await conn.query(`UPDATE insurances SET ${fields} WHERE id = ?`, values);
    }

    async delete(id, conn = pool) {
        return await conn.query("DELETE FROM insurances WHERE id = ?", [id]);
    }
}

module.exports = new InsuranceRepository();
