const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const conn = await pool.getConnection();
    try {
        console.log("Reading migration file...");
        const sql = fs.readFileSync(path.join(__dirname, 'scripts', 'create_patient_view.sql'), 'utf8');
        
        console.log("Executing migration...");
        await conn.query(sql);
        
        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

runMigration();
