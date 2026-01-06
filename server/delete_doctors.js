const mariadb = require('mariadb');
const dotenv = require('dotenv');
dotenv.config();

const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'cima1255',
    database: 'clinical_management',
    connectionLimit: 5
});

async function deleteDoctors() {
    let conn;
    try {
        conn = await pool.getConnection();

        // IDs identified in previous step:
        // House (id:3, user:12), Wilson (id:4, user:13), Cuddy (id:5, user:14), Foreman (id:6, user:15), Juan (id:7, user:1011)
        // KEEP: Ceci (id:8, user:1012)

        const doctorsToDelete = [3, 4, 5, 6, 7];
        const usersToDelete = [12, 13, 14, 15, 1011];

        console.log(`Deleting ${doctorsToDelete.length} doctors and their user accounts...`);

        // Delete from doctors table first (Foreign Key constraint likely exists but ON DELETE CASCADE might handle it)
        // Checking schema: doctors -> users (ON DELETE CASCADE)
        // So deleting USERS should delete DOCTORS automatically. Let's try that to be cleaner.

        // Wait, 'doctors' table has a constraint: CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        // Yes, deleting the user will delete the doctor profile.

        for (const uid of usersToDelete) {
            console.log(`Deleting User ID: ${uid}`);
            await conn.query("DELETE FROM users WHERE id = ?", [uid]);
        }

        console.log("Deletion complete.");

        // Verify result
        const remainingDoctors = await conn.query("SELECT * FROM doctors");
        console.log("Remaining Doctors:", remainingDoctors);

    } catch (err) {
        console.error("Error deleting doctors:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

deleteDoctors();
