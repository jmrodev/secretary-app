

/**
 * AuditRepository
 * Handles data access for audit logs.
 */
class AuditRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async create(data, conn = this.pool) {
        const { user_id, username, action, details, ip_address } = data;
        return await conn.query(
            "INSERT INTO audit_logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)",
            [user_id, username, action, details, ip_address]
        );
    }

    async findRecentLogs(limit = 100, conn = this.pool) {
        return await conn.query(
            "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?",
            [limit]
        );
    }

    async findRecycleBin(conn = this.pool) {
        return await conn.query(
            "SELECT * FROM recycle_bin ORDER BY deleted_at DESC"
        );
    }
}

module.exports = (pool) => new AuditRepository(pool);
