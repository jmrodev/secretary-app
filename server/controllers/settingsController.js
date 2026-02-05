const { pool } = require('../db');
const { refreshRemoteAccess, initRemoteAccess } = require('../utils/remoteAccessService');

exports.getSettings = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM system_settings");
        const settings = {};

        rows.forEach(r => {
            const key = r.setting_key;
            const val = r.setting_value;

            // Whitelist for common settings
            if ([
                'google_sync_enabled',
                'remote_access_method',
                'duckdns_domain',
                'enable_office_rentals',
                'staff_base_url',
                'public_base_url',
                'pharmacy_email',
                'pharmacy_phone'
            ].includes(key)) {
                settings[key] = val;
            }
            // Masking logic
            else if (['google_refresh_token', 'meta_access_token', 'duckdns_token'].includes(key)) {
                if (val && val.length > 0) {
                    settings[key] = "MASKED_PRESENT";
                }
            }
            // Add other non-sensitive keys that don't start with prefixes
            else if (!key.startsWith('google_') && !key.startsWith('meta_') && !key.startsWith('duckdns_')) {
                settings[key] = val;
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

        await conn.query(`
            INSERT INTO system_settings (setting_key, setting_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE setting_value = ?
        `, [key, String(value), String(value)]);

        // Special Logic: Reinits
        if (key === 'remote_access_method') {
            initRemoteAccess();
        }

        if (key === 'enable_office_rentals' && String(value) === 'false') {
            await conn.query("UPDATE doctors SET rental_cost = 0, rental_type = 'monthly'");
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
        refreshRemoteAccess();
        res.json({ message: "Refresh initiated. It may take a minute to update the URL." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to refresh remote access" });
    }
};
