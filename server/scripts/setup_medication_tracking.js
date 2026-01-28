const { pool } = require('../db');

async function setup() {
    let conn;
    try {
        console.log("Connecting to DB...");
        conn = await pool.getConnection();

        console.log("Creating medical_request_items table...");
        await conn.query(`
            CREATE TABLE IF NOT EXISTS medical_request_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                medication_name VARCHAR(255) NOT NULL,
                dose VARCHAR(100),
                frequency VARCHAR(100),
                quantity INT,
                status ENUM('pending', 'approved', 'rejected', 'modified') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES medical_requests(id) ON DELETE CASCADE
            )
        `);
        console.log("Table medical_request_items created successfully.");

    } catch (err) {
        console.error("Error setting up database:", err);
    } finally {
        if (conn) conn.release();
        pool.end(); // Close pool
        process.exit();
    }
}

setup();
