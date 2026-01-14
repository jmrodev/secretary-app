const { pool } = require('../db');

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to DB");

        // Create institutions table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS institutions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Created institutions table");

        // Add institution_id to patients if not exists
        try {
            await conn.query(`SELECT institution_id FROM patients LIMIT 1`);
            console.log("Column institution_id already exists in patients");
        } catch (e) {
            console.log("Adding institution_id to patients...");
            await conn.query(`
                ALTER TABLE patients 
                ADD COLUMN institution_id INT DEFAULT NULL,
                ADD CONSTRAINT fk_patient_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
            `);
            console.log("Added institution_id column and FK");
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
