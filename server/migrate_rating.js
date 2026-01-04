const { pool } = require('./db');

(async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to DB, checking for column...");

        // Check if column exists
        const columns = await conn.query("SHOW COLUMNS FROM patients LIKE 'financial_rating'");
        if (columns.length === 0) {
            console.log("Column 'financial_rating' not found. Adding it...");
            await conn.query("ALTER TABLE patients ADD COLUMN financial_rating INT DEFAULT 5"); // Default 5 stars
            console.log("Column added successfully.");
        } else {
            console.log("Column 'financial_rating' already exists.");
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
})();
