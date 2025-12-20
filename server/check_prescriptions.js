const { pool } = require('./db');

async function check() {
    try {
        const conn = await pool.getConnection();
        console.log("--- Counts ---");
        const [pCount] = await conn.query("SELECT COUNT(*) as c FROM prescriptions");
        console.log("Prescriptions:", pCount.c);
        const [aCount] = await conn.query("SELECT COUNT(*) as c FROM appointments");
        console.log("Appointments:", aCount.c);

        console.log("\n--- Prescriptions Data ---");
        const pres = await conn.query("SELECT * FROM prescriptions");
        console.log(pres);

        console.log("\n--- Full Join Test ---");
        const joined = await conn.query(`
            SELECT pr.id, p.full_name as patient, d.full_name as doctor
            FROM prescriptions pr
            LEFT JOIN appointments a ON pr.appointment_id = a.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN patients p ON a.patient_id = p.id
        `);
        console.log(joined);

        conn.release();
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
