const { pool } = require('../db');
const { refreshTunnel } = require('../utils/tunnel-manager');

exports.getSettings = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM system_settings");
        // Convert rows to object { key: value }
        const settings = {};
        rows.forEach(r => {
            // Exclude sensitive keys logic
            // Allow 'google_sync_enabled' to pass through
            if (r.setting_key === 'google_sync_enabled') {
                settings[r.setting_key] = r.setting_value;
            }
            // For tokens, don't send the value, just existence check if needed, OR relies on a separate "isConnected" check.
            // But to fix current frontend logic easily:
            else if (r.setting_key === 'google_refresh_token') {
                // Send dummy value if exists, just to signal "Connected" to frontend
                if (r.setting_value && r.setting_value.length > 0) {
                    settings[r.setting_key] = "MASKED_PRESENT";
                }
            }
            // Block other sensitive google_ keys (access_token, client_secret, etc)
            else if (!r.setting_key.startsWith('google_')) {
                settings[r.setting_key] = r.setting_value;
            }
        });
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updateSetting = async (req, res) => {
    let conn;
    try {
        const { key, value } = req.body;
        conn = await pool.getConnection();

        // Update the setting
        await conn.query(`
            INSERT INTO system_settings (setting_key, setting_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE setting_value = ?
        `, [key, String(value), String(value)]);

        // Special Logic: If disabling rentals, clear rental costs for all doctors
        if (key === 'enable_office_rentals' && String(value) === 'false') {
            await conn.query("UPDATE doctors SET rental_cost = 0, rental_type = 'monthly'");
            console.log("Office rentals disabled: Reset all doctor rental costs to 0.");
        }

        res.json({ message: "Setting updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.refreshTunnel = (req, res) => {
    try {
        refreshTunnel();
        res.json({ message: "Tunnel refresh initiated. It may take a minute to update the URL." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to refresh tunnel" });
    }
};
