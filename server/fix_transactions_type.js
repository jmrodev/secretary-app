const { pool } = require('./db');

async function fix() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Modifying transactions.type to VARCHAR(50)...");
        await conn.query("ALTER TABLE transactions MODIFY COLUMN type VARCHAR(50) NOT NULL");
        console.log("Done.");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

fix();
