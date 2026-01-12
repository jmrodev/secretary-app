const mariadb = require('mariadb');
const dotenv = require('dotenv');

dotenv.config();

// Force IPv4 if localhost is failing
const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin123', // Fallback based on common password seen
    database: process.env.DB_NAME || 'secretary_db', // Fallback based on previous context
    port: Number(process.env.DB_PORT) || 3306,
    connectionLimit: 5
});

async function debugData() {
    let conn;
    try {
        console.log("Connecting to", process.env.DB_NAME, "at 127.0.0.1...");
        conn = await pool.getConnection();
        console.log("Connected.");

        console.log("--- USERS (id, username, role) ---");
        const users = await conn.query("SELECT id, username, role FROM users");
        console.table(users);

        console.log("\n--- DOCTORS (id, user_id, full_name) ---");
        const doctors = await conn.query("SELECT id, user_id, full_name FROM doctors");
        console.table(doctors);

        console.log("\n--- PATIENTS (id, user_id, full_name, insurance_id) ---");
        const patients = await conn.query("SELECT id, user_id, full_name, insurance_id FROM patients");
        console.table(patients);

        console.log("\n--- APPOINTMENTS (last 10) ---");
        const appointments = await conn.query("SELECT id, patient_id, doctor_id, appointment_date, status FROM appointments ORDER BY id DESC LIMIT 10");
        console.table(appointments);

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

debugData();
