const { pool } = require('../db');
const { logAction } = require('../utils/audit'); // Assuming this utility exists

exports.getAllInsurances = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM insurances ORDER BY name ASC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getInsuranceById = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM insurances WHERE id = ?", [id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).send("Insurance not found");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.createInsurance = async (req, res) => {
    let conn;
    try {
        const { name, cuit, website, email, phone, address, status } = req.body;
        if (!name) return res.status(400).send("Name is required");

        conn = await pool.getConnection();
        const result = await conn.query(
            "INSERT INTO insurances (name, cuit, website, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [name, cuit, website, email, phone, address, status || 'active']
        );
        res.status(201).json({ id: Number(result.insertId), message: "Insurance created" });
        logAction(req, 'CREATE_INSURANCE', `Created insurance ${name}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updateInsurance = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const updates = req.body;

        conn = await pool.getConnection();

        let fields = [];
        let params = [];
        const allowed = ['name', 'cuit', 'website', 'email', 'phone', 'address', 'status'];

        for (const key of allowed) {
            if (updates[key] !== undefined) {
                fields.push(`${key} = ?`);
                params.push(updates[key]);
            }
        }

        if (fields.length === 0) return res.status(400).send("No valid fields");

        params.push(id);
        const query = `UPDATE insurances SET ${fields.join(', ')} WHERE id = ?`;

        await conn.query(query, params);
        res.json({ message: "Insurance updated" });
        logAction(req, 'UPDATE_INSURANCE', `Updated insurance ${id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.deleteInsurance = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();

        // Soft delete or hard delete?
        // If hard delete, check constraints via DB error.
        await conn.query("DELETE FROM insurances WHERE id = ?", [id]);

        res.json({ message: "Insurance deleted" });
        logAction(req, 'DELETE_INSURANCE', `Deleted insurance ${id}`);
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(409).send("Cannot delete: This insurance is assigned to patients.");
        } else {
            res.status(500).send("Server Error");
        }
    } finally {
        if (conn) conn.release();
    }
};
