const { pool } = require('./db');
async function check() {
    let conn;
    try {
        conn = await pool.getConnection();
        const cols = await conn.query("DESCRIBE patient_medications");
        console.log("patient_medications:", cols);
        const cols2 = await conn.query("DESCRIBE medical_request_items");
        console.log("medical_request_items:", cols2);
    } catch (e) {
        console.error(e);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}
check();
