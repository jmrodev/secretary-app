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
            SELECT id, username, role, can_manage_users, can_crud_appointments, 
                   can_edit_past_appointments, can_crud_requests, can_crud_prescriptions, 
                   can_crud_licenses, can_crud_files, can_crud_finances, created_at,
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
                ELSE 'Administrador'
            END as full_name,
            CASE 
                WHEN role = 'patient' THEN (SELECT dni FROM patients WHERE user_id = users.id)
                WHEN role = 'doctor' THEN (SELECT dni FROM doctors WHERE user_id = users.id)
                WHEN role = 'secretary' THEN (SELECT dni FROM secretaries WHERE user_id = users.id)
                ELSE NULL
            END as dni,
            CASE 
                WHEN role = 'patient' THEN (SELECT phone FROM patients WHERE user_id = users.id)
                WHEN role = 'doctor' THEN (SELECT phone FROM doctors WHERE user_id = users.id)
                WHEN role = 'secretary' THEN (SELECT phone FROM secretaries WHERE user_id = users.id)
                ELSE NULL
            END as phone
            FROM users
            WHERE role != 'patient'
            ORDER BY created_at DESC
        `);
    }

    async findById(id, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM users WHERE id = ?", [id]);
        return rows[0] || null;
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
        // Bump token_version to evict existing JWTs (other sessions must re-login)
        return await conn.query(
            "UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?",
            [hashedPassword, id]
        );
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

    /**
     * Lists all secretary accounts with their permission flags,
     * joined with the secretary profile name.
     */
    async findSecretaryPermissions(conn = this.pool) {
        return await conn.query(`
            SELECT u.id, u.username, u.can_manage_users, u.can_crud_appointments, 
                   u.can_edit_past_appointments, u.can_crud_requests, u.can_crud_prescriptions, 
                   u.can_crud_licenses, u.can_crud_files, u.can_crud_finances, s.full_name
            FROM users u
            LEFT JOIN secretaries s ON s.user_id = u.id
            WHERE u.role = 'secretary'
            ORDER BY s.full_name IS NULL, s.full_name ASC
        `);
    }

    /**
     * Returns permissions for a single secretary by user ID.
     */
    async getSecretaryPermissions(userId, conn = this.pool) {
        const rows = await conn.query(`
            SELECT id, username, role, can_manage_users, can_crud_appointments, 
                   can_edit_past_appointments, can_crud_requests, can_crud_prescriptions, 
                   can_crud_licenses, can_crud_files, can_crud_finances 
            FROM users 
            WHERE id = ? AND role = 'secretary'
        `, [userId]);
        return rows[0] || null;
    }

    /**
     * Updates granular permissions for a user and bumps token_version.
     */
    async updatePermissions(userId, permissions, conn = this.pool) {
        const fields = [];
        const values = [];

        const allowedKeys = [
            'can_manage_users', 'can_crud_appointments', 'can_edit_past_appointments',
            'can_crud_requests', 'can_crud_prescriptions', 'can_crud_licenses',
            'can_crud_files', 'can_crud_finances'
        ];

        for (const key of allowedKeys) {
            if (permissions[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(permissions[key] ? 1 : 0);
            }
        }

        if (fields.length === 0) return false;

        fields.push('token_version = token_version + 1');
        values.push(userId);

        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        const result = await conn.query(query, values);
        return result.affectedRows > 0;
    }

    /**
     * Returns the ids of every secretary account (used for bulk grants).
     */
    async findSecretaryUserIds(conn = this.pool) {
        const rows = await conn.query("SELECT id FROM users WHERE role = 'secretary'");
        return rows.map(row => row.id);
    }

    /**
     * Sets can_manage_users for the given user ids and bumps token_version
     * so existing JWTs are evicted and the affected users must re-authenticate.
     */
    async updateCanManageUsers(ids, value, conn = this.pool) {
        const placeholders = ids.map(() => '?').join(', ');
        return await conn.query(
            `UPDATE users SET can_manage_users = ?, token_version = token_version + 1 WHERE id IN (${placeholders})`,
            [value ? 1 : 0, ...ids]
        );
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new UserRepository(defaultPool);
const factory = (customPool) => new UserRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
