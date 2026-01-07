const mariadb = require('mariadb');
require('dotenv').config({ path: './server/.env' });

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3307
});

async function checkData() {
    let conn;
    try {
        conn = await pool.getConnection();
        const doctors = await conn.query("SELECT id, user_id, full_name FROM doctors LIMIT 3");
        const patients = await conn.query("SELECT id, user_id, full_name FROM patients LIMIT 3");

        console.log("Doctors:", doctors);
        console.log("Patients:", patients);
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

checkData();
