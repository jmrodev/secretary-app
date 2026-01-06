const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'cima1255',
    database: process.env.DB_NAME || 'clinical_management',
    port: 3307 // External port for running from host
});

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();

        console.log("Creating active_holidays table...");
        await conn.query(`
            CREATE TABLE IF NOT EXISTS active_holidays (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATE NOT NULL UNIQUE,
                description VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table active_holidays created or already exists.");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        pool.end();
    }
}

migrate();
