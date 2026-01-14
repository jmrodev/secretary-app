const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: process.env.DB_PASSWORD || 'cima1255',
    database: 'clinical_management',
    port: 3307,
    connectionLimit: 5
});

async function migrate() {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to database at 127.0.0.1...");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS patient_access_tokens (
                id int(11) NOT NULL AUTO_INCREMENT,
                token varchar(64) NOT NULL,
                patient_id int(11) DEFAULT NULL,
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                expires_at timestamp NOT NULL,
                PRIMARY KEY (id),
                UNIQUE KEY token (token),
                KEY patient_id (patient_id),
                CONSTRAINT patient_access_tokens_ibfk_1 FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        console.log("Table 'patient_access_tokens' created or already exists.");
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
