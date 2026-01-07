const mariadb = require('mariadb');
require('dotenv').config({ path: './server/.env' });

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3307,
    connectionLimit: 5
});

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Connected to database.');

        // Create patient_doctors table
        // id, patient_id, doctor_id, created_at
        const sql = `
            CREATE TABLE IF NOT EXISTS patient_doctors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_assignment (patient_id, doctor_id),
                CONSTRAINT fk_pd_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                CONSTRAINT fk_pd_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `;

        await conn.query(sql);
        console.log('Table patient_doctors created or already exists.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

migrate();
