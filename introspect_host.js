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

        const [doctors] = await conn.query("SELECT * FROM doctors");
        console.log("All Doctors:", doctors);

        if (users.length > 0) {
            const userId = users[0].id;
            const [docProfile] = await conn.query("SELECT * FROM doctors WHERE user_id = ?", [userId]);
            console.log("Doctor Profile for Cecilia:", docProfile);

            if (docProfile.length > 0) {
                const docId = docProfile[0].id;
                const [appts] = await conn.query("SELECT count(*) as count FROM appointments WHERE doctor_id = ?", [docId]);
                console.log(`Appointments for Doctor ID ${docId}:`, appts[0].count);
            }
        }

        await conn.end();

    } catch (e) {
        console.error(e);
    }
}

check();
