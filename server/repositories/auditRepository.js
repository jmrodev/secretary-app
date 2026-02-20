const { pool } = require('../db');

/**
 * AuditRepository
 * Handles data access for audit logs.
 */
class AuditRepository {
    async create(data, conn = pool) {
        const { user_id, username, action, details, ip_address } = data;
        return await conn.query(
            "INSERT INTO audit_logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)",
            [user_id, username, action, details, ip_address]
        );
    }

    async findRecentLogs(limit = 100, conn = pool) {
        return await conn.query(
            "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?",
            [limit]
        );
    }

    async findRecycleBin(conn = pool) {
        return await conn.query(
            "SELECT * FROM recycle_bin ORDER BY deleted_at DESC"
        );
    }
}

module.exports = new AuditRepository();
