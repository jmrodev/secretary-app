const { pool } = require('../db');

async function runMigration() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to database...");

        // 1. Create doctor_schedules table
        console.log("Creating doctor_schedules table...");
        await conn.query(`
            CREATE TABLE IF NOT EXISTS doctor_schedules (
                id int(11) NOT NULL AUTO_INCREMENT,
                doctor_id int(11) NOT NULL,
                day_of_week int(11) NOT NULL,
                start_time time NOT NULL,
                end_time time NOT NULL,
                is_break tinyint(1) DEFAULT 0,
                created_at timestamp NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                KEY doctor_id (doctor_id),
                CONSTRAINT doctor_schedules_fk FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        // 2. Add is_out_of_hours column to appointments
        console.log("Checking appointments table columns...");
        const rows = await conn.query("SHOW COLUMNS FROM appointments LIKE 'is_out_of_hours'");
        if (rows.length === 0) {
            console.log("Adding is_out_of_hours column to appointments...");
            await conn.query("ALTER TABLE appointments ADD COLUMN is_out_of_hours tinyint(1) DEFAULT 0");
        } else {
            console.log("Column is_out_of_hours already exists.");
        }

        console.log("Migration completed successfully.");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

runMigration();
