const { pool } = require('./db');
(async () => {
    try {
        const rows = await pool.query("DESCRIBE patients");
        console.log("PATIENTS SCHEMA:");
        console.log(JSON.stringify(rows, null, 2));
        
        const msgRows = await pool.query("DESCRIBE whatsapp_messages");
        console.log("\nWHATSAPP_MESSAGES SCHEMA:");
        console.log(JSON.stringify(msgRows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
})();
