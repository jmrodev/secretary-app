const mariadb = require('mariadb');
require('dotenv').config({ path: './server/.env' });

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3307
});

async function verifyLogic() {
    let conn;
    try {
        conn = await pool.getConnection();

        const doctorId = 8;
        const patientId = 4; // Mario Rossi

        console.log(`Test: Assigning Patient ${patientId} to Doctor ${doctorId}...`);

        // 1. Assign
        await conn.query("DELETE FROM patient_doctors WHERE patient_id = ?", [patientId]);
        await conn.query("INSERT INTO patient_doctors (patient_id, doctor_id) VALUES (?, ?)", [patientId, doctorId]);
        console.log("Assigned.");

        // 2. Filter Query (Simulating userController.getAllPatients for Doctor)
        console.log(`Test: Fetching patients for Doctor ${doctorId}...`);
        const query = `
            SELECT p.id, p.full_name
            FROM patients p
            INNER JOIN patient_doctors pd ON p.id = pd.patient_id 
            WHERE pd.doctor_id = ?
        `;
        const rows = await conn.query(query, [doctorId]);
        console.log("Result:", rows);

        if (rows.length > 0 && rows[0].id === patientId) {
            console.log("PASS: Patient correctly filtered.");
        } else {
            console.log("FAIL: Patient not found or incorrect.");
        }

        // 3. Filter for another doctor
        const otherDocId = 999;
        const rows2 = await conn.query(query, [otherDocId]);
        console.log(`Test: Fetching for Doctor ${otherDocId} (Result count: ${rows2.length})`);

        if (rows2.length === 0) {
            console.log("PASS: No patients for other doctor.");
        } else {
            console.log("FAIL: Found patients unexpectedly.");
        }

    } catch (err) {
        console.error("Test Failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

verifyLogic();
