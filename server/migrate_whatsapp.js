const { pool } = require('./db');
(async () => {
    try {
        console.log("Starting migration...");
        // 1. Allow patient_id to be NULL
        await pool.query("ALTER TABLE whatsapp_messages MODIFY patient_id INT NULL");
        
        // 2. Add sender_phone column if not exists
        const columns = await pool.query("SHOW COLUMNS FROM whatsapp_messages LIKE 'sender_phone'");
        if (columns.length === 0) {
            await pool.query("ALTER TABLE whatsapp_messages ADD COLUMN sender_phone VARCHAR(20) AFTER patient_id");
            console.log("Column sender_phone added.");
        }
        
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
})();
