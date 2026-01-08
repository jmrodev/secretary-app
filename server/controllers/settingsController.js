const { pool } = require('../db');

exports.getSettings = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM system_settings");
        // Convert rows to object { key: value }
        const settings = {};
        rows.forEach(r => {
            // Exclude sensitive keys
            if (!r.setting_key.startsWith('google_')) {
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
