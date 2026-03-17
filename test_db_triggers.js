const pool = require('./server/db');

async function check() {
    try {
        console.log("Conectando...");
        const conn = await pool.getConnection();
        const triggers = await conn.query("SHOW TRIGGERS");
        console.log("TRIGGERS DETECTADAS:", triggers.length);
        triggers.forEach(t => console.log(t.Trigger, t.Event, t.Timing, t.Statement));
        conn.release();
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
