const { pool } = require('./db');

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection(); // missing await in some patterns, ensuring it here
        console.log("Checking appointments table...");

        // Check if column exists
        const [columns] = await conn.query("SHOW COLUMNS FROM appointments LIKE 'cancellation_reason'");

        if (columns.length === 0) {
            console.log("Adding cancellation_reason column...");
            await conn.query("ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT DEFAULT NULL AFTER status");
            console.log("Column added successfully.");
        } else {
            console.log("Column cancellation_reason already exists.");
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
