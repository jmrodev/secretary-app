
const mariadb = require('mariadb');
require('dotenv').config({ path: 'server/.env' });

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: process.env.DB_PASSWORD || 'cima1255',
    database: 'clinical_management',
    port: 3307
});

async function cleanJan12() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Cleaning up data for Monday Jan 12, 2026...");

        // 1. Get Appointments on this day
        const appts = await conn.query("SELECT id FROM appointments WHERE appointment_date >= '2026-01-12 00:00:00' AND appointment_date <= '2026-01-12 23:59:59'");
        const apptIds = appts.map(a => a.id);

        if (apptIds.length === 0) {
            console.log("No appointments found for this date.");
        } else {
            console.log(`Found ${apptIds.length} appointments: ${apptIds.join(', ')}`);

            // 2. Delete Transactions Linked to these Appointments
            const txRes = await conn.query("DELETE FROM transactions WHERE appointment_id IN (?)", [apptIds]);
            console.log(`Deleted ${txRes.affectedRows} transactions.`);

            // 3. Delete the Appointments
            const apptRes = await conn.query("DELETE FROM appointments WHERE id IN (?)", [apptIds]);
            console.log(`Deleted ${apptRes.affectedRows} appointments.`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        if (conn) conn.release();
    }
}

cleanJan12();
