

/**
 * SecretaryRepository
 * Handles data access for secretaries.
 */
const ALLOWED_UPDATES = [
    'user_id', 'full_name', 'phone', 'dni'
];

class SecretaryRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async create(data, conn = this.pool) {
        const { user_id, full_name, dni, phone } = data;
        const result = await conn.query(
            "INSERT INTO secretaries (user_id, full_name, dni, phone) VALUES (?, ?, ?, ?)",
            [user_id, full_name, dni, phone]
        );
        return Number(result.insertId);
    }

    async findById(id, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM secretaries WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async findByUserId(userId, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM secretaries WHERE user_id = ?", [userId]);
        return rows[0] || null;
    }

    async update(id, updates, conn = this.pool) {
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
        return await conn.query(`UPDATE secretaries SET ${fields} WHERE id = ?`, values);
    }

    async updateByUserId(userId, updates, conn = this.pool) {
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
        const values = [...Object.values(validUpdates), userId];
        return await conn.query(`UPDATE secretaries SET ${fields} WHERE user_id = ?`, values);
    }

    async delete(id, conn = this.pool) {
        return await conn.query("DELETE FROM secretaries WHERE id = ?", [id]);
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new SecretaryRepository(defaultPool);
const factory = (customPool) => new SecretaryRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
