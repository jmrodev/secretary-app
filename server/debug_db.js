const { pool } = require('./db');

async function debugData() {
    try {
        console.log("--- USERS ---");
        const users = await pool.query("SELECT id, username, role FROM users");
        console.table(users);

        console.log("\n--- DOCTORS ---");
        const doctors = await pool.query("SELECT id, user_id, full_name, specialty FROM doctors");
        console.table(doctors);

        console.log("\n--- APPOINTMENTS ---");
        const appointments = await pool.query("SELECT id, patient_id, doctor_id, appointment_date FROM appointments LIMIT 5");
        console.table(appointments);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debugData();
