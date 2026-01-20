const { pool } = require('./db');

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Updating Vademecum index...");

        // Check if index exists and drop it to recreate with presentacion
        const indexes = await conn.query("SHOW INDEX FROM vademecum WHERE Key_name = 'idx_vademecum_search'");
        if (indexes.length > 0) {
            await conn.query("ALTER TABLE vademecum DROP INDEX idx_vademecum_search");
        }

        await conn.query("ALTER TABLE vademecum ADD FULLTEXT INDEX idx_vademecum_search (nombre, presentacion, monodroga, laboratorio)");

        console.log("Success: Vademecum search now includes 'presentacion' (e.g., doses and tablet counts)");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
