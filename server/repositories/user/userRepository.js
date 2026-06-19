/**
 * UserRepository
 * Handles data access for the users table and admin-level user queries.
 */
class UserRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findAllStaff(conn = this.pool) {
        return await conn.query(`
            SELECT id, username, role, created_at,
            CASE 
                WHEN role = 'patient' THEN (SELECT id FROM patients WHERE user_id = users.id)
                WHEN role = 'doctor' THEN (SELECT id FROM doctors WHERE user_id = users.id)
                WHEN role = 'secretary' THEN (SELECT id FROM secretaries WHERE user_id = users.id)
                ELSE NULL
            END as profile_id,
            CASE 
                WHEN role = 'patient' THEN (SELECT full_name FROM patients WHERE user_id = users.id)
                WHEN role = 'doctor' THEN (SELECT full_name FROM doctors WHERE user_id = users.id)
                WHEN role = 'secretary' THEN (SELECT full_name FROM secretaries WHERE user_id = users.id)
                ELSE 'System'
            END as full_name
            FROM users
            WHERE role != 'patient'
            ORDER BY created_at DESC
        `);
    }

    async create(data, conn = this.pool) {
        const result = await conn.query(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            [data.username, data.password_hash, data.role]
        );
        return Number(result.insertId);
    }

    async upsert(data, conn = this.pool) {
        return await conn.query(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)",
            [data.username, data.password_hash, data.role]
        );
    }

    async updatePassword(id, hashedPassword, conn = this.pool) {
        return await conn.query("UPDATE users SET password_hash = ? WHERE id = ?", [hashedPassword, id]);
    }

    async update(id, updates, conn = this.pool) {
        const { username, role } = updates;
        return await conn.query("UPDATE users SET username = ?, role = ? WHERE id = ?", [username, role, id]);
    }

    async delete(id, conn = this.pool) {
        return await conn.query("DELETE FROM users WHERE id = ?", [id]);
    }

    async findByUsername(username, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
        return rows[0] || null;
    }

    async findAdminPasswordHash(conn = this.pool) {
        const rows = await conn.query("SELECT password_hash FROM users WHERE username = 'admin'");
        return rows[0] || null;
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new UserRepository(defaultPool);
const factory = (customPool) => new UserRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
