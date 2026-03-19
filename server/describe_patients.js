const { pool } = require('./db');

async function test() {
    try {
        const rows = await pool.query("DESCRIBE patients");
        console.log("COLUMNS IN 'patients' TABLE:");
        console.log("----------------------------");
        for (const r of rows) {
            console.log(`Field: ${r.Field.padEnd(25)} | Type: ${r.Type.padEnd(20)} | Null: ${r.Null} | Key: ${r.Key}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

test();
