const { pool } = require('./db');

async function checkSchema() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SHOW COLUMNS FROM appointments");
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}
checkSchema();
