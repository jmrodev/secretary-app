const { pool } = require('./db');

async function check() {
    console.log("Attempting to connect to DB...");
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected!");

        const users = await conn.query("SELECT id, username, role FROM users");
        console.log(`Found ${users.length} users.`);
        console.dir(users);

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        if (conn) conn.release();
        pool.end();
    }
}

check();
