const { pool } = require('../db');

exports.getHolidays = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM active_holidays WHERE date >= CURDATE() ORDER BY date ASC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.addHoliday = async (req, res) => {
    let conn;
    try {
        const { date, description } = req.body;
        if (!date || !description) return res.status(400).send("Date and description required");

        conn = await pool.getConnection();
        await conn.query("INSERT INTO active_holidays (date, description) VALUES (?, ?)", [date, description]);
        res.status(201).json({ message: "Holiday added" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).send("Holiday already exists for this date");
        }
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.deleteHoliday = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();
        await conn.query("DELETE FROM active_holidays WHERE id = ?", [id]);
        res.json({ message: "Holiday deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
