const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'cima1255',
    database: 'clinical_management',
    port: 3307
});

async function main() {
    let conn;
    try {
        conn = await pool.getConnection();
        const patients = await conn.query("SELECT id, full_name, user_id FROM patients LIMIT 1");
        const doctors = await conn.query("SELECT id, full_name, user_id FROM doctors LIMIT 1");
        console.log("Patient:", patients[0]);
        console.log("Doctor:", doctors[0]);
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        pool.end();
    }
}

main();
