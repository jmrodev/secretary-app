const { pool } = require('./db');

async function purify() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Starting Vademecum purification...");

        // clean up if exists from failed run
        await conn.query("DROP TABLE IF EXISTS vademecum_purified");
        await conn.query("DROP TABLE IF EXISTS vademecum_old");

        console.log("Creating temporary table...");
        // 1. Create temp table with same structure/indexes
        await conn.query("CREATE TABLE vademecum_purified LIKE vademecum");

        console.log("Inserting distinct records...");
        // 2. Insert DISTINCT records
        // Using DISTINCT on relevant fields to filter out exact duplicates
        const res = await conn.query(`
            INSERT INTO vademecum_purified
            (nombre, presentacion, monodroga, laboratorio, vademecum_type, fcias_propias, fcias_convenidas, observaciones)
            SELECT DISTINCT nombre, presentacion, monodroga, laboratorio, vademecum_type, fcias_propias, fcias_convenidas, observaciones
            FROM vademecum
        `);
        console.log(`Inserted ${Number(res.affectedRows)} unique records.`);

        // Get count of original
        const countOld = await conn.query("SELECT COUNT(*) as c FROM vademecum");
        console.log(`Original count was: ${countOld[0].c}`);

        console.log("Swapping tables...");
        // 3. Rename tables
        await conn.query("RENAME TABLE vademecum TO vademecum_old, vademecum_purified TO vademecum");

        console.log("Dropping old table...");
        // 4. Drop old table
        await conn.query("DROP TABLE vademecum_old");

        console.log("Purification complete!");

    } catch (err) {
        console.error("Purification failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

purify();
