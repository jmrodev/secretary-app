const mariadb = require('mariadb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = mariadb.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'clinical_management',
    port: parseInt(process.env.DB_PORT) || 3307,
    connectionLimit: 5
});

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to database for migration...");

        // 1. Create prescription_request_tokens table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS prescription_request_tokens (
                id INT NOT NULL AUTO_INCREMENT,
                patient_id INT NOT NULL,
                doctor_id INT DEFAULT NULL,
                token VARCHAR(64) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                PRIMARY KEY (id),
                UNIQUE KEY token (token),
                KEY patient_id (patient_id),
                CONSTRAINT fk_prt_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
                CONSTRAINT fk_prt_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log("Table 'prescription_request_tokens' verified.");

        // 2. Add raw_medication_data to medical_requests if it doesn't exist
        const columns = await conn.query("SHOW COLUMNS FROM medical_requests LIKE 'raw_medication_data'");
        if (columns.length === 0) {
            await conn.query("ALTER TABLE medical_requests ADD COLUMN raw_medication_data TEXT DEFAULT NULL");
            console.log("Added column 'raw_medication_data' to 'medical_requests'.");
        }

        const originColumn = await conn.query("SHOW COLUMNS FROM medical_requests LIKE 'is_patient_submitted'");
        if (originColumn.length === 0) {
            await conn.query("ALTER TABLE medical_requests ADD COLUMN is_patient_submitted BOOLEAN DEFAULT FALSE");
            console.log("Added column 'is_patient_submitted' to 'medical_requests'.");
        }

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        if (conn) conn.release();
    }
}

migrate();
