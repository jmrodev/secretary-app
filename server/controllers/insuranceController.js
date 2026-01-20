const { pool } = require('../db');
const { logAction } = require('../utils/audit'); // Assuming this utility exists

exports.getAllInsurances = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM insurances ORDER BY name ASC");

        for (let i = 0; i < rows.length; i++) {
            const phones = await conn.query("SELECT * FROM phone_numbers WHERE entity_type = 'insurance' AND entity_id = ?", [rows[i].id]);
            rows[i].phoneNumbers = phones;
        }

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
            const row = rows[0];
            const phones = await conn.query("SELECT * FROM phone_numbers WHERE entity_type = 'insurance' AND entity_id = ?", [id]);
            row.phoneNumbers = phones;
            res.json(row);
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
        const { name, cuit, website, email, phone, address, status, phoneNumbers } = req.body;
        if (!name) return res.status(400).send("Name is required");

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const result = await conn.query(
            "INSERT INTO insurances (name, cuit, website, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [name, cuit, website, email, phone, address, status || 'active']
        );
        const insId = Number(result.insertId);

        if (Array.isArray(phoneNumbers)) {
            let primaryPhone = phone;
            for (const pn of phoneNumbers) {
                await conn.query("INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label) VALUES (?, ?, ?, ?, ?)",
                    ['insurance', insId, pn.phone_number, pn.is_primary ? 1 : 0, pn.label || 'Celular']);
                if (pn.is_primary) primaryPhone = pn.phone_number;
            }
            if (primaryPhone) {
                await conn.query("UPDATE insurances SET phone = ? WHERE id = ?", [primaryPhone, insId]);
            }
        }

        await conn.commit();
        res.status(201).json({ id: insId, message: "Insurance created" });
        logAction(req, 'CREATE_INSURANCE', `Created insurance ${name}`);
    } catch (err) {
        if (conn) await conn.rollback();
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
        const { phoneNumbers } = updates;

        conn = await pool.getConnection();
        await conn.beginTransaction();

        let fields = [];
        let params = [];
        const allowed = ['name', 'cuit', 'website', 'email', 'phone', 'address', 'status'];

        for (const key of allowed) {
            if (updates[key] !== undefined) {
                fields.push(`${key} = ?`);
                params.push(updates[key]);
            }
        }

        if (fields.length > 0) {
            params.push(id);
            const query = `UPDATE insurances SET ${fields.join(', ')} WHERE id = ?`;
            await conn.query(query, params);
        }

        if (phoneNumbers !== undefined && Array.isArray(phoneNumbers)) {
            await conn.query("DELETE FROM phone_numbers WHERE entity_type = 'insurance' AND entity_id = ?", [id]);
            let primaryPhone = updates.phone;
            for (const pn of phoneNumbers) {
                await conn.query("INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label) VALUES (?, ?, ?, ?, ?)",
                    ['insurance', id, pn.phone_number, pn.is_primary ? 1 : 0, pn.label || 'Celular']);
                if (pn.is_primary) primaryPhone = pn.phone_number;
            }
            if (primaryPhone) {
                await conn.query("UPDATE insurances SET phone = ? WHERE id = ?", [primaryPhone, id]);
            }
        }

        await conn.commit();
        res.json({ message: "Insurance updated" });
        logAction(req, 'UPDATE_INSURANCE', `Updated insurance ${id}`);
    } catch (err) {
        if (conn) await conn.rollback();
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
