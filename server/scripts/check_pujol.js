const { pool } = require('../db');

async function checkPujol() {
    let conn;
    try {
        conn = await pool.getConnection();
        const patients = await conn.query("SELECT id, full_name FROM patients WHERE full_name LIKE '%Pujol%' OR last_name LIKE '%Pujol%'");

        console.log("Patients found:", patients);

        for (const p of patients) {
            const appts = await conn.query("SELECT * FROM appointments WHERE patient_id = ?", [p.id]);
            console.log(`Appointments for ${p.full_name}:`, appts.length);
            appts.forEach(a => {
                console.log(` - Date: ${a.appointment_date}, Status: ${a.status}`);
            });
        }

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

checkPujol();
