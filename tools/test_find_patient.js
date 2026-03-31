const pool = require('./server/db');

async function check() {
    try {
        console.log("Buscando paciente...");
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id, first_name, last_name, full_name, phone FROM patients WHERE last_name LIKE '%Her%' OR full_name LIKE '%Her%'");
        console.log("PACIENTES ENCONTRADOS:", rows.length);
        rows.forEach(r => console.log(r));
        conn.release();
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
