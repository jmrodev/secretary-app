const { pool } = require('./db');

(async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to DB, creating system_settings table...");

        await conn.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("Table 'system_settings' verified.");

        // Insert default for office rentals if not exists
        await conn.query(`
            INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES ('enable_office_rentals', 'true')
        `);
        console.log("Default settings inserted.");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
})();
