const { pool } = require('../db');

exports.getAllInstitutions = async (req, res) => {
    try {
        const rows = await pool.query(`
            SELECT i.*, 
                   COALESCE((
                       SELECT SUM(t.amount) 
                       FROM transactions t 
                       LEFT JOIN appointments a ON t.appointment_id = a.id
                       WHERE t.institution_id = i.id 
                         AND t.status = 'pending'
                         AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent'))
                   ), 0) as total_debt
            FROM institutions i 
            ORDER BY i.name ASC
        `);

        // Fetch phones for each institution
        for (let i = 0; i < rows.length; i++) {
            const phones = await pool.query("SELECT * FROM phone_numbers WHERE entity_type = 'institution' AND entity_id = ?", [rows[i].id]);
            rows[i].phoneNumbers = phones;
        }

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch institutions" });
    }
};

exports.createInstitution = async (req, res) => {
    const { name, description, status, base_price, phoneNumbers } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const result = await conn.query(
            "INSERT INTO institutions (name, description, status, base_price) VALUES (?, ?, ?, ?)",
            [name, description, status || 'active', base_price || 0]
        );
        const instId = Number(result.insertId);

        if (Array.isArray(phoneNumbers)) {
            for (const pn of phoneNumbers) {
                await conn.query("INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label) VALUES (?, ?, ?, ?, ?)",
                    ['institution', instId, pn.phone_number, pn.is_primary ? 1 : 0, pn.label || 'Celular']);
            }
        }

        await conn.commit();
        res.status(201).json({ id: instId, name, description, status, base_price });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ error: "Failed to create institution" });
    } finally {
        if (conn) conn.release();
    }
};

exports.updateInstitution = async (req, res) => {
    const { id } = req.params;
    const { name, description, status, base_price, phoneNumbers } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        await conn.query(
            "UPDATE institutions SET name = ?, description = ?, status = ?, base_price = ? WHERE id = ?",
            [name, description, status, base_price || 0, id]
        );

        if (phoneNumbers !== undefined && Array.isArray(phoneNumbers)) {
            await conn.query("DELETE FROM phone_numbers WHERE entity_type = 'institution' AND entity_id = ?", [id]);
            for (const pn of phoneNumbers) {
                await conn.query("INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label) VALUES (?, ?, ?, ?, ?)",
                    ['institution', id, pn.phone_number, pn.is_primary ? 1 : 0, pn.label || 'Celular']);
            }
        }

        await conn.commit();
        res.json({ message: "Institution updated" });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ error: "Failed to update institution" });
    } finally {
        if (conn) conn.release();
    }
};

exports.deleteInstitution = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if assigned to patients? Foreign Key is ON DELETE SET NULL, so straightforward delete is fine.
        await pool.query("DELETE FROM institutions WHERE id = ?", [id]);
        res.json({ message: "Institution deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete institution" });
    }
};

exports.getInstitutionFinances = async (req, res) => {
    try {
        const { id } = req.params; // Institution ID

        // Get Transactions linked to this institution
        const query = `
            SELECT 
                t.id as transaction_id,
                t.amount,
                t.description,
                t.transaction_date,
                t.status as payment_status,
                t.method,
                p.full_name as patient_name,
                d.full_name as doctor_name,
                a.id as appointment_id,
                a.appointment_date,
                a.status as appointment_status
            FROM transactions t
            LEFT JOIN appointments a ON t.appointment_id = a.id
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON t.doctor_id = d.id
            WHERE t.institution_id = ?
            ORDER BY t.transaction_date DESC
        `;

        const rows = await pool.query(query, [id]);

        // Calculate totals based on transactions
        const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount), 0);
        const totalPending = rows.reduce((sum, r) => {
            if (r.payment_status !== 'pending') return sum;
            // Exclude future appointments from "Debt" calculation
            if (r.appointment_id && !['completed', 'attended', 'arrived', 'absent'].includes(r.appointment_status)) {
                return sum;
            }
            return sum + Number(r.amount);
        }, 0);

        res.json({
            institution_id: id,
            total_amount: totalAmount,
            total_pending: totalPending,
            transactions: rows
        });

    } catch (err) {
        console.error("Institution Finances Error:", err);
        res.status(500).json({ error: "Failed to fetch finances" });
    }
};
exports.getInstitutionPatients = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT p.id, p.full_name, p.dni, p.next_suggested_visit_date,
                   p.tariff_percent, p.tariff_override,
                   (SELECT MAX(appointment_date) FROM appointments WHERE patient_id = p.id AND status = 'completed') as last_visit_date
            FROM patients p
            WHERE p.institution_id = ?
            ORDER BY p.full_name ASC
        `;
        const rows = await pool.query(query, [id]);
        res.json(rows);
    } catch (err) {
        console.error("Institution Patients Error:", err);
        res.status(500).json({ error: "Failed to fetch institution patients" });
    }
};
