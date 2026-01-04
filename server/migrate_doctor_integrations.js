const { pool } = require('./db');

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Starting migration: doctor_integrations table...");

        await conn.query(`
            CREATE TABLE IF NOT EXISTS doctor_integrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctor_id INT NOT NULL,
                access_token TEXT NOT NULL,
                refresh_token TEXT NOT NULL,
                token_expiry BIGINT NOT NULL,
                calendar_id VARCHAR(255) DEFAULT 'primary',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
                UNIQUE KEY unique_doctor (doctor_id)
            )
        `);

        console.log("Migration successful: doctor_integrations table created.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
