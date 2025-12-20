const { pool } = require('./db');

async function createMedicalRequestsTable() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`
            CREATE TABLE IF NOT EXISTS medical_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('prescription', 'license') NOT NULL,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                secretary_id INT, -- Can be null if patient requested directly, though mostly secretary
                status ENUM('pending', 'completed', 'rejected') DEFAULT 'pending',
                request_note TEXT,
                doctor_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id),
                FOREIGN KEY (doctor_id) REFERENCES doctors(id),
                FOREIGN KEY (secretary_id) REFERENCES users(id) -- Linking to generic users table for secretary
            );
        `);
        console.log("medical_requests table created");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

createMedicalRequestsTable();
