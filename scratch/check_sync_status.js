const { pool } = require('../server/db');

async function checkSyncSetting() {
    try {
        const [rows] = await pool.query("SELECT * FROM system_settings WHERE setting_key = 'google_sync_enabled'");
        console.log("Setting google_sync_enabled:", rows);
        
        const [integrations] = await pool.query("SELECT doctor_id FROM google_integrations");
        console.log("Doctors with linked Google accounts:", integrations.length);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSyncSetting();
