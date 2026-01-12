const mariadb = require('mariadb');

// Hardcoded from .env inspection
const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'cima1255',
    database: 'clinical_management',
    port: 3306,
    connectionLimit: 5
});

async function debugData() {
    let conn;
    try {
        console.log("Connecting to clinical_management at 127.0.0.1...");
        conn = await pool.getConnection();
        console.log("Connected.");

        console.log("--- USERS (id, username, role) ---");
        const users = await conn.query("SELECT id, username, role FROM users");
        console.table(users);

        console.log("\n--- DOCTORS (id, user_id, full_name) ---");
        const doctors = await conn.query("SELECT id, user_id, full_name FROM doctors");
        console.table(doctors);

        console.log("\n--- APPOINTMENTS (last 10) ---");
        // Joined with doctor name to see who owns what
        const appointments = await conn.query(`
            SELECT a.id, a.patient_id, a.doctor_id, d.full_name as doctor_name, a.appointment_date, a.status 
            FROM appointments a 
            LEFT JOIN doctors d ON a.doctor_id = d.id 
            ORDER BY a.id DESC LIMIT 10
        `);
        console.table(appointments);

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

debugData();
