const { pool } = require('../db');

exports.getSettings = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM system_settings");
        // Convert rows to object { key: value }
        const settings = {};
        rows.forEach(r => {
            settings[r.setting_key] = r.setting_value;
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

        res.json({ message: "Setting updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
