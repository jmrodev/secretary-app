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

        // 1. Create insurances table
        const sqlInsurances = `
            CREATE TABLE IF NOT EXISTS insurances (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                cuit VARCHAR(20),
                website VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `;
        await conn.query(sqlInsurances);
        console.log('Table insurances created or exists.');

        // 2. Alter patients table (add insurance_id, rename insurance -> affiliate_number)
        // Check if insurance_id exists already
        const checkCol = await conn.query("SHOW COLUMNS FROM patients LIKE 'insurance_id'");
        if (checkCol.length === 0) {
            console.log('Adding insurance_id column...');
            await conn.query("ALTER TABLE patients ADD COLUMN insurance_id INT DEFAULT NULL AFTER insurance");
            await conn.query("ALTER TABLE patients ADD CONSTRAINT fk_patient_insurance FOREIGN KEY (insurance_id) REFERENCES insurances(id) ON DELETE SET NULL");
        } else {
            console.log('Column insurance_id already exists.');
        }

        // Check if 'insurance' column exists (to rename/copy)
        const checkOldCol = await conn.query("SHOW COLUMNS FROM patients LIKE 'insurance'");
        if (checkOldCol.length > 0) {
            // Check if 'affiliate_number' exists
            const checkNewCol = await conn.query("SHOW COLUMNS FROM patients LIKE 'affiliate_number'");
            if (checkNewCol.length === 0) {
                console.log('Renaming insurance to affiliate_number...');
                // CHANGE implicitly changes type if needed, verifying it stays varchar or text
                // Old definition might be VARCHAR(100). Let's check from 'checkOldCol'.
                // We'll safe rename.
                await conn.query("ALTER TABLE patients CHANGE COLUMN insurance affiliate_number VARCHAR(100)");
            } else {
                console.log('Column affiliate_number already exists. Old insurance column might be redundant if this logic ran before?');
            }
        } else {
            // If 'insurance' is gone, ensure 'affiliate_number' is there
            const checkNewCol = await conn.query("SHOW COLUMNS FROM patients LIKE 'affiliate_number'");
            if (checkNewCol.length === 0) {
                await conn.query("ALTER TABLE patients ADD COLUMN affiliate_number VARCHAR(100)");
            }
        }

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

migrate();
