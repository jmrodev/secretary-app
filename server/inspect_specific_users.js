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

async function inspectUsers() {
    let conn;
    try {
        conn = await pool.getConnection();

        // Check Admin
        const admins = await conn.query("SELECT id, username, role FROM users WHERE role='admin'");
        console.log("--- ADMIN S ---");
        console.log(admins);

        // Check Doctors
        const doctors = await conn.query("SELECT d.id, d.full_name, d.user_id, u.username FROM doctors d JOIN users u ON d.user_id = u.id");
        console.log("--- DOCTORS ---");
        console.log(doctors);

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

inspectUsers();
