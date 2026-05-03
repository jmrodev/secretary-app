const { pool } = require('./db');
(async () => {
    try {
        const rows = await pool.query("DESCRIBE whatsapp_messages");
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
})();
