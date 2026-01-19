
const mariadb = require('mariadb');
require('dotenv').config({ path: 'server/.env' });

const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: process.env.DB_PASSWORD || 'cima1255',
    database: 'clinical_management',
    port: 3307
});

async function checkJan12() {
    try {
        console.log("Listing ALL transactions for Monday Jan 12, 2026...");

        // Check typically based on transaction_date OR based on appointment_date of the linked appointment
        const rows = await pool.query(`
            SELECT 
                t.*, 
                a.appointment_date, a.status as appt_status, a.reason,
                p.full_name, p.dni
            FROM transactions t
            LEFT JOIN appointments a ON t.appointment_id = a.id
            LEFT JOIN patients p ON t.related_user_id = p.user_id
            WHERE 
                (t.transaction_date >= '2026-01-12 00:00:00' AND t.transaction_date <= '2026-01-12 23:59:59')
                OR
                (a.appointment_date >= '2026-01-12 00:00:00' AND a.appointment_date <= '2026-01-12 23:59:59')
            ORDER BY t.id DESC
        `);

        console.log("Full Data Dump for Jan 12:");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkJan12();
