const { pool } = require('./db');
async function test() {
    const conn = await pool.getConnection();
    try {
        const res = await conn.query("SELECT 1 as val");
        console.log("Result type:", Array.isArray(res) ? "Array" : typeof res);
        console.log("Result length:", res.length);
        console.log("First element:", res[0]);
    } finally {
        conn.release();
        process.exit();
    }
}
test();
