require('dotenv').config({ path: '../.env' });
const { pool } = require('../db');

async function showAppointments() {
    let conn;
    try {
        conn = await pool.getConnection();

        console.log("--- 1. Appointments with Google ID (Likely Synced/Imported) ---");
        const [synced] = await conn.query(`
            SELECT id, patient_id, appointment_date, reason, status, payment_status, google_event_id 
            FROM appointments 
            WHERE google_event_id IS NOT NULL 
            ORDER BY id DESC LIMIT 3
        `);
        console.table(synced);

        console.log("\n--- 2. Appointments WITHOUT Google ID (Old/Local Only) ---");
        const [local] = await conn.query(`
            SELECT id, patient_id, appointment_date, reason, status, payment_status, google_event_id 
            FROM appointments 
            WHERE google_event_id IS NULL 
            AND appointment_date > NOW()
            ORDER BY id DESC LIMIT 3
        `);
        console.table(local);

        console.log("\n--- 3. Details of a purely imported one (Hypothetical) ---");
        // Try to find one where we might identify it as "external"
        // Usually these might have NULL patient_id if parsing failed, or simple reasons?
        const [external] = await conn.query(`
            SELECT id, patient_id, appointment_date, reason, status, google_event_id
            FROM appointments
            WHERE google_event_id IS NOT NULL AND (reason NOT LIKE 'Motivo:%' OR reason IS NULL)
            LIMIT 3
        `);
        if (external.length > 0) {
            console.table(external);
        } else {
            console.log("No obvious 'external format' appointments found in this small sample.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

showAppointments();
