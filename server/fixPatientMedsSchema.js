const { pool } = require('./db');

async function fixSchema() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Adding columns to patient_medications...");

        // Use separate ALTERs to be safe or try-catch each
        try {
            await conn.query("ALTER TABLE patient_medications ADD COLUMN next_refill_date DATE NULL");
            console.log("Added next_refill_date");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("next_refill_date already exists");
            else console.log(e);
        }

        try {
            await conn.query("ALTER TABLE patient_medications ADD COLUMN notes TEXT NULL");
            console.log("Added notes");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("notes already exists");
            else console.log(e);
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

fixSchema();
