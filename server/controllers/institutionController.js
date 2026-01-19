const { pool } = require('../db');

exports.getAllInstitutions = async (req, res) => {
    try {
        const rows = await pool.query(`
            SELECT i.*, 
                   COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.institution_id = i.id AND t.status = 'pending'), 0) as total_debt
            FROM institutions i 
            ORDER BY i.name ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch institutions" });
    }
};

exports.createInstitution = async (req, res) => {
    const { name, description, status, base_price } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
        const result = await pool.query(
            "INSERT INTO institutions (name, description, status, base_price) VALUES (?, ?, ?, ?)",
            [name, description, status || 'active', base_price || 0]
        );
        res.status(201).json({ id: parseInt(result.insertId), name, description, status, base_price });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create institution" });
    }
};

exports.updateInstitution = async (req, res) => {
    const { id } = req.params;
    const { name, description, status, base_price } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
        await pool.query(
            "UPDATE institutions SET name = ?, description = ?, status = ?, base_price = ? WHERE id = ?",
            [name, description, status, base_price || 0, id]
        );
        res.json({ message: "Institution updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update institution" });
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
        const totalPending = rows.reduce((sum, r) => r.payment_status === 'pending' ? sum + Number(r.amount) : sum, 0);

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
