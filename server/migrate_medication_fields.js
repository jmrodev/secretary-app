const { pool } = require('./db');
async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Adding columns to medical_request_items...");
        try {
            await conn.query("ALTER TABLE medical_request_items ADD COLUMN units_per_box INT DEFAULT NULL");
        } catch (e) { console.log("medical_request_items.units_per_box already exists or error:", e.message); }
        try {
            await conn.query("ALTER TABLE medical_request_items ADD COLUMN daily_intake DECIMAL(10,2) DEFAULT NULL");
        } catch (e) { console.log("medical_request_items.daily_intake already exists or error:", e.message); }

        console.log("Adding columns to prescription_items...");
        try {
            await conn.query("ALTER TABLE prescription_items ADD COLUMN units_per_box INT DEFAULT NULL");
        } catch (e) { console.log("prescription_items.units_per_box already exists or error:", e.message); }
        try {
            await conn.query("ALTER TABLE prescription_items ADD COLUMN daily_intake DECIMAL(10,2) DEFAULT NULL");
        } catch (e) { console.log("prescription_items.daily_intake already exists or error:", e.message); }

        console.log("Migration finished.");
    } catch (e) {
        console.error(e);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}
migrate();
