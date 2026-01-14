const { pool } = require('../db');

exports.getAllInstitutions = async (req, res) => {
    try {
        const rows = await pool.query("SELECT * FROM institutions ORDER BY name ASC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch institutions" });
    }
};

exports.createInstitution = async (req, res) => {
    const { name, description, status } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
        const result = await pool.query(
            "INSERT INTO institutions (name, description, status) VALUES (?, ?, ?)",
            [name, description, status || 'active']
        );
        res.status(201).json({ id: parseInt(result.insertId), name, description, status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create institution" });
    }
};

exports.updateInstitution = async (req, res) => {
    const { id } = req.params;
    const { name, description, status } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
        await pool.query(
            "UPDATE institutions SET name = ?, description = ?, status = ? WHERE id = ?",
            [name, description, status, id]
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
        // const { startDate, endDate } = req.query; // Optional filters

        // Get appointments where patient is assigned to this institution
        // Join appointments -> patients -> institutions
        // Also get debts (pending payments)

        const query = `
            SELECT 
                a.id as appointment_id,
                a.appointment_date,
                a.status,
                a.cost,
                a.payment_status,
                a.is_paid,
                p.id as patient_id,
                p.full_name as patient_name,
                d.full_name as doctor_name,
                inst.name as institution_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN institutions inst ON p.institution_id = inst.id
            WHERE p.institution_id = ?
            ORDER BY a.appointment_date DESC
        `;

        const rows = await pool.query(query, [id]);

        // Calculate totals
        const totalAmount = rows.reduce((sum, r) => sum + Number(r.cost), 0);
        const totalPending = rows.reduce((sum, r) => r.payment_status !== 'paid' ? sum + Number(r.cost) : sum, 0);

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
