const { pool } = require('./db');

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Updating transactions table...");

        // Add columns if they don't exist
        // MariaDB doesn't support IF NOT EXISTS in ALTER TABLE nicely in one go for multiple columns usually, so we do try/catch or simple ADD
        // simplified approach: ADD COLUMN IF NOT EXISTS is supported in newer MariaDB

        const alterQueries = [
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS doctor_id INT",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS method VARCHAR(50) DEFAULT 'cash'", // cash, debit, transfer, mp
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'paid'", // pending, paid
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS proof_file VARCHAR(255)",
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_withdrawal BOOLEAN DEFAULT FALSE",
            "ALTER TABLE transactions ADD CONSTRAINT fk_trans_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL"
        ];

        for (const q of alterQueries) {
            try {
                await conn.query(q);
                console.log("Executed:", q);
            } catch (ignore) {
                // Ignore errors if column exists or constraint issues for now (simplified migration)
                console.log("Skipped/Error:", q, ignore.message);
            }
        }

        console.log("Migration complete.");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
