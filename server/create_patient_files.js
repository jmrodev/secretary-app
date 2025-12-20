const { pool } = require('./db');

async function createPatientFilesTable() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`
            CREATE TABLE IF NOT EXISTS patient_files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                uploaded_by INT NOT NULL, -- User ID (Secretary/Doctor/Admin)
                file_name VARCHAR(255) NOT NULL,
                file_url VARCHAR(500) NOT NULL,
                file_type VARCHAR(50), -- pdf, image, etc.
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id),
                FOREIGN KEY (uploaded_by) REFERENCES users(id)
            );
        `);
        console.log("patient_files table created");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

createPatientFilesTable();
