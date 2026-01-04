const { pool } = require('./db');

(async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to DB, checking for column...");

        // Check if old column exists
        const columns = await conn.query("SHOW COLUMNS FROM patients LIKE 'financial_rating'");
        if (columns.length > 0) {
            console.log("Renaming 'financial_rating' to 'behavior_rating'...");
            await conn.query("ALTER TABLE patients CHANGE COLUMN financial_rating behavior_rating INT DEFAULT 5");
            console.log("Column renamed successfully.");
        } else {
            // Check if behavior_rating already exists (idempotency)
            const newCols = await conn.query("SHOW COLUMNS FROM patients LIKE 'behavior_rating'");
            if (newCols.length === 0) {
                console.log("Neither column found. Adding 'behavior_rating'...");
                await conn.query("ALTER TABLE patients ADD COLUMN behavior_rating INT DEFAULT 5");
            } else {
                console.log("'behavior_rating' already exists.");
            }
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
})();
