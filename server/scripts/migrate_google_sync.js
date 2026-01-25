
const mariadb = require('mariadb');

async function migrate() {
    let conn;
    try {
        const pool = mariadb.createPool({
            host: '127.0.0.1',
            port: 3307,
            user: 'root',
            password: 'cima1255',
            database: 'clinical_management'
        });
        conn = await pool.getConnection();

        console.log("Adding last_error column to google_sync_queue...");

        // Check if column exists first to avoid error
        const [columns] = await conn.query("SHOW COLUMNS FROM google_sync_queue LIKE 'last_error'");
        if (columns) {
            console.log("Column last_error already exists.");
        } else {
            await conn.query("ALTER TABLE google_sync_queue ADD COLUMN last_error TEXT DEFAULT NULL");
            console.log("Column last_error added successfully.");
        }

        conn.release();
        process.exit(0);
    } catch (err) {
        console.error("Migration Error:", err);
        process.exit(1);
    }
}

migrate();
