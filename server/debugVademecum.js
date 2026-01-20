const { pool } = require('./db');
async function check() {
    let conn;
    try {
        conn = await pool.getConnection();
        const count = await conn.query("SELECT COUNT(*) as total FROM vademecum");
        console.log("Total records in vademecum:", count[0].total);
        const samples = await conn.query("SELECT nombre, laboratorio FROM vademecum WHERE laboratorio LIKE '%raffo%' LIMIT 5");
        console.log("Raffo samples:", samples);
        const searchRes = await conn.query("SELECT nombre FROM vademecum WHERE MATCH(nombre, presentacion, monodroga, laboratorio) AGAINST('+raffo*' IN BOOLEAN MODE) LIMIT 5");
        console.log("Fulltext search for '+raffo*':", searchRes);
    } catch (e) {
        console.error(e);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}
check();
