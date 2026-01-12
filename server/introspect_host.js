const mysql = require('mysql2/promise');

async function check() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            port: 3307,
            user: 'root',
            password: 'cima1255',
            database: 'clinical_management'
        });

        console.log("--- Connected ---");

        const [users] = await conn.query("SELECT id, username, role FROM users WHERE username LIKE '%cecilia%'");
        console.log("Users (Cecilia):", users);

        if (users.length > 0) {
            const userId = users[0].id;
            const [docProfile] = await conn.query("SELECT * FROM doctors WHERE user_id = ?", [userId]);
            console.log("Doctor Profile for Cecilia:", docProfile);

            if (docProfile.length > 0) {
                const docId = docProfile[0].id;
                const [appts] = await conn.query("SELECT id, doctor_id, appointment_date, status FROM appointments WHERE doctor_id = ? ORDER BY appointment_date DESC LIMIT 5", [docId]);
                console.log(`Appointments for Doctor ID ${docId} (first 5):`, appts);
            } else {
                console.log("No doctor profile found for this user!");
            }
        } else {
            console.log("User 'cecilia' not found!");
        }

        await conn.end();

    } catch (e) {
        console.error(e);
    }
}

check();
