const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'cima1255',
    database: 'clinical_management',
    port: 3307
});

async function main() {
    let conn;
    try {
        conn = await pool.getConnection();
        // Insert for today 14:00 (approx 1 hour from "now" 12:55)
        const date = '2026-01-06 14:00:00';
        const res = await conn.query(
            "INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, payment_status, reason) VALUES (?, ?, ?, ?, ?, ?)",
            [4, 8, date, 'pending', 'pending', 'Test Dashboard Appointment']
        );
        console.log("Inserted Appointment ID:", res.insertId);
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        pool.end();
    }
}

main();
