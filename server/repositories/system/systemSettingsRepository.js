

/**
 * SystemSettingsRepository
 * Handles data access for global system configuration.
 */
class SystemSettingsRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findAll(conn = this.pool) {
        return await conn.query("SELECT * FROM system_settings");
    }

    async findByKey(key, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM system_settings WHERE setting_key = ?", [key]);
        return rows[0] || null;
    }

    async upsert(key, value, conn = this.pool) {
        return await conn.query(`
            INSERT INTO system_settings (setting_key, setting_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE setting_value = ?
        `, [key, String(value), String(value)]);
    }

    async updateDoctorRentalLogic(conn = this.pool) {
        return await conn.query("UPDATE doctors SET rental_cost = 0, rental_type = 'monthly'");
    }

    async findManyByKeys(keys, conn = this.pool) {
        const rows = await conn.query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (?)", [keys]);
        return rows;
    }
}

module.exports = (pool) => new SystemSettingsRepository(pool);
