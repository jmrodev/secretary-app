const mariadb = require('mariadb');

(async () => {
    let conn;
    try {
        console.log("Connecting to DB to update ENUM...");
        conn = await mariadb.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'admin123',
            database: 'clinical_management',
            port: 3306
        });
    } catch (err) {
        console.log("Standard connect failed, trying fallback...");
        try {
            conn = await mariadb.createConnection({
                host: '127.0.0.1',
                user: 'root',
                password: 'cima1255',
                database: 'clinical_management',
                port: 3307
            });
        } catch (e) {
            console.error("FATAL: Could not connect to DB.");
            process.exit(1);
        }
    }

    try {
        console.log("Connected. Altering table...");
        await conn.query(`
            ALTER TABLE appointments 
            MODIFY COLUMN status ENUM('pending','confirmed','completed','cancelled','suspended','absent','rescheduled','arrived') DEFAULT 'pending'
        `);
        console.log("ENUM updated successfully.");
    } catch (err) {
        console.error("Error updating table:", err.message);
    } finally {
        if (conn) conn.end();
    }
})();
