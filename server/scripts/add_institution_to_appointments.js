const { pool } = require('../db');

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to database. Checking 'appointments' table...");

        // Check if column exists
        const columns = await conn.query("SHOW COLUMNS FROM appointments LIKE 'institution_id'");
        if (columns.length > 0) {
            console.log("Column 'institution_id' already exists in 'appointments'. Skipping.");
        } else {
            console.log("Adding 'institution_id' column to 'appointments'...");
            await conn.query("ALTER TABLE appointments ADD COLUMN institution_id INT DEFAULT NULL"); // Add FK if needed later
            console.log("Column added successfully.");
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
