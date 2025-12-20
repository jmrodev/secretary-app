const { pool } = require('./db');
async function check() {
    try {
        const conn = await pool.getConnection();
        const rows = await conn.query("DESCRIBE medical_requests");
        console.log(rows);
        conn.release();
    } catch (e) { console.error(e); }
    process.exit();
}
check();
