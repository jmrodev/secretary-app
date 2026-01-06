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
        const rows = await conn.query("SELECT id, appointment_date, status, patient_id, doctor_id FROM appointments");
        console.log("All Appointments:", rows);

        const today = new Date().toISOString().split('T')[0];
        console.log("JS Today (ISO split):", today);

        const todays = rows.filter(r => {
            // Simulate frontend logic somewhat
            // Note: mariadb driver returns Date objects for datetime columns by default
            if (r.appointment_date instanceof Date) {
                return r.appointment_date.toISOString().startsWith(today);
            }
            return String(r.appointment_date).startsWith(today);
        });

        console.log("Filtered for Today (Frontend Logic):", todays);

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        pool.end();
    }
}

main();
