const mariadb = require('mariadb');

(async () => {
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'admin123', // Common password or try cima1255 if this fails
            database: 'clinical_management',
            port: 3306
        });
        console.log("Connected to DB");

        const [rows] = await conn.query("DESC medical_requests");
        console.table(rows);

        conn.end();
    } catch (err) {
        console.error("Connection Error:", err.message);
        // Try alternate password/port if needed
        if (err.message.includes('Access denied') || err.message.includes('ECONNREFUSED')) {
            try {
                console.log("Retrying with cima1255 on 3307...");
                conn = await mariadb.createConnection({
                    host: '127.0.0.1',
                    user: 'root',
                    password: 'cima1255',
                    database: 'clinical_management',
                    port: 3307
                });
                console.log("Connected on Retry.");
                const rows = await conn.query("DESC appointments");
                console.log(JSON.stringify(rows, null, 2));
                conn.end();
            } catch (e) {
                console.error("Retry failed:", e.message);
            }
        }
    } finally {
        process.exit();
    }
})();
