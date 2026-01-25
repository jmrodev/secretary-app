
const mariadb = require('mariadb');

async function checkGoogleStatus() {
    let conn;
    try {
        const pool = mariadb.createPool({
            host: '127.0.0.1',
            port: 3307,
            user: 'root',
            password: 'cima1255',
            database: 'clinical_management'
        });
        conn = await pool.getConnection();

        console.log("--- System Settings ---");
        const settings = await conn.query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'google%'");
        if (Array.isArray(settings)) {
            settings.forEach(s => {
                const val = s.setting_key.includes('token') ? (s.setting_value ? 'PRESENT (HIDDEN)' : 'MISSING') : s.setting_value;
                console.log(`${s.setting_key}: ${val}`);
            });
        } else {
            console.log("Settings query returned unexpected type:", typeof settings);
        }

        console.log("\n--- Doctor Integrations ---");
        const docs = await conn.query("SELECT doctor_id, token_expiry FROM doctor_integrations");
        if (Array.isArray(docs)) {
            if (docs.length === 0) console.log("No individual doctor integrations found.");
            docs.forEach(d => {
                console.log(`Doctor ID ${d.doctor_id}: Expiry ${new Date(parseInt(d.token_expiry)).toLocaleString()}`);
            });
        }

        console.log("\n--- Sync Queue Stats ---");
        const queue = await conn.query("SELECT status, retries, last_error, COUNT(*) as count FROM google_sync_queue GROUP BY status, retries, last_error");
        if (Array.isArray(queue)) {
            queue.forEach(q => console.log(`Status: ${q.status}, Retries: ${q.retries}, Count: ${q.count}, Last Error: ${q.last_error ? q.last_error.substring(0, 50) + '...' : 'None'}`));
        }

        conn.release();
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkGoogleStatus();
