

/**
 * GoogleIntegrationRepository
 * Handles data access for Google OAuth integrations (per-doctor and global).
 */
class GoogleIntegrationRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findDoctorIntegration(doctorId, conn = this.pool) {
        const rows = await conn.query("SELECT id FROM doctor_integrations WHERE doctor_id = ?", [doctorId]);
        return rows[0] || null;
    }

    async findAllDoctorIds(conn = this.pool) {
        return await conn.query("SELECT doctor_id FROM doctor_integrations");
    }

    async deleteDoctorIntegration(doctorId, conn = this.pool) {
        return await conn.query("DELETE FROM doctor_integrations WHERE doctor_id = ?", [doctorId]);
    }

    async findGlobalToken(conn = this.pool) {
        const rows = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'google_refresh_token'");
        return rows[0] || null;
    }

    async deleteGlobalTokens(conn = this.pool) {
        return await conn.query(
            "DELETE FROM system_settings WHERE setting_key IN ('google_refresh_token', 'google_access_token', 'google_token_expiry')"
        );
    }

    async findAfipEnvironment(conn = this.pool) {
        const rows = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'afip_environment'");
        return rows[0]?.setting_value || 'testing';
    }

    async resetSyncQueue(conn = this.pool) {
        return await conn.query("UPDATE google_sync_queue SET retries = 0, status = 'pending', updated_at = NOW() WHERE retries >= 5");
    }

    async resetSpreadsheetId(doctorId, conn = this.pool) {
        return await conn.query("UPDATE doctor_integrations SET spreadsheet_id = NULL WHERE doctor_id = ?", [doctorId]);
    }

    async updateSpreadsheetId(doctorId, spreadsheetId, conn = this.pool) {
        return await conn.query("UPDATE doctor_integrations SET spreadsheet_id = ? WHERE doctor_id = ?", [spreadsheetId, doctorId]);
    }

    async enqueueSync(data, conn = this.pool) {
        const { appointment_id, doctor_id, action, payload } = data;
        return await conn.query(
            "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, ?, ?, 'pending')",
            [appointment_id, doctor_id, action, JSON.stringify(payload)]
        );
    }

    async findTokensByDoctorId(doctorId, conn = this.pool) {
        const rows = await conn.query("SELECT refresh_token, access_token, token_expiry FROM doctor_integrations WHERE doctor_id = ?", [doctorId]);
        return rows[0] || null;
    }

    async upsertTokens(doctorId, tokens, conn = this.pool) {
        const { access_token, refresh_token, token_expiry } = tokens;
        return await conn.query(`
            INSERT INTO doctor_integrations (doctor_id, access_token, refresh_token, token_expiry)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            access_token = VALUES(access_token),
            refresh_token = IF(VALUES(refresh_token) IS NOT NULL AND VALUES(refresh_token) != '', VALUES(refresh_token), refresh_token),
            token_expiry = VALUES(token_expiry)
        `, [doctorId, access_token, refresh_token, token_expiry]);
    }

    async findPendingSyncItems(limit = 10, conn = this.pool) {
        return await conn.query("SELECT * FROM google_sync_queue WHERE status = 'pending' AND retries < 5 ORDER BY created_at ASC LIMIT ?", [limit]);
    }

    async updateSyncItemError(id, error, conn = this.pool) {
        return await conn.query("UPDATE google_sync_queue SET retries = retries + 1, last_error = ?, updated_at = NOW() WHERE id = ?", [error, id]);
    }

    async deleteSyncItem(id, conn = this.pool) {
        return await conn.query("DELETE FROM google_sync_queue WHERE id = ?", [id]);
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new GoogleIntegrationRepository(defaultPool);
const factory = (customPool) => new GoogleIntegrationRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
