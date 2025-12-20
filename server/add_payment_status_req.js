const { pool } = require('./db');

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Updating medical_requests table...");
        await conn.query("ALTER TABLE medical_requests ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'debt') DEFAULT 'pending'");
        console.log("Migration complete.");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
