const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'cima1255',
    database: process.env.DB_NAME || 'clinical_management',
    connectionLimit: 5
});

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to database...");

        // Check if column exists
        const [rows] = await conn.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'clinical_management' 
            AND TABLE_NAME = 'patients' 
            AND COLUMN_NAME = 'email'
        `);

        if (rows) {
            console.log("Column 'email' already exists in 'patients' table.");
        } else {
            console.log("Adding 'email' column to 'patients' table...");
            await conn.query(`ALTER TABLE patients ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER phone`);
            console.log("Column 'email' added successfully.");
        }

    } catch (err) {
        console.error("Migration Failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
