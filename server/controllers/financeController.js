const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const { calculatePrice } = require('../utils/priceCalculator');

// --- Consolidated Finances ---

exports.createTransaction = async (req, res) => {
    let conn;
    try {
        // type: income_patient, income_rental, expense_general, payment_doctor, withdrawal
        // related_user_id: Patient or Doctor interacting
        // doctor_id: Beneficiary of the cash box
        const { type, amount, description, related_user_id, doctor_id, method, status, debt_amount, appointment_id } = req.body;
        const proof_file = req.file ? `/uploads/${req.file.filename}` : null;

        conn = await pool.getConnection();

        // 1. Register the Payment (if amount > 0)
        // If amount is 0, it means they paid nothing now, everything is debt? 
        // Let's assume there's always a transaction record.
        if (Number(amount) > 0) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, proof_file, request_id, appointment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [type, amount, description, related_user_id || null, doctor_id || null, method || 'cash', status || 'paid', proof_file, req.body.request_id || null, appointment_id || null]
            );
        }

        // 2. Register the Debt (if debt_amount > 0)
        if (Number(debt_amount) > 0) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, proof_file, request_id, appointment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [type, debt_amount, `DEBT: ${description}`, related_user_id || null, doctor_id || null, 'credit', 'pending', null, req.body.request_id || null, appointment_id || null]
            );
        }

        // 3. Update Appointment payment_status if apptId is provided
        if (appointment_id) {
            const finalStatus = Number(debt_amount) > 0 ? (Number(amount) > 0 ? 'partial' : 'debt') : 'paid';
            const isPaid = finalStatus === 'paid' ? 1 : 0;
            await conn.query("UPDATE appointments SET payment_status = ?, is_paid = ? WHERE id = ?", [finalStatus, isPaid, appointment_id]);
        }

        let logDetail = `${type}: $${amount} - ${description}`;
        if (Number(debt_amount) > 0) logDetail += ` (Debt: $${debt_amount})`;

        logAction(req, 'FINANCE_TRANSACTION', logDetail);

        res.status(201).json({ message: "Transaction recorded", status: status || 'paid' });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getTransactions = async (req, res) => {
    let conn;
    try {
        const { role, user_id } = req.user;
        const { doctor_id } = req.query; // Admin/Secretary can filter by specific doctor

        conn = await pool.getConnection();
        let query = `SELECT t.*, u.username as related_user_name, d.full_name as doctor_name
                     FROM transactions t 
                     LEFT JOIN users u ON t.related_user_id = u.id
                     LEFT JOIN doctors d ON t.doctor_id = d.id`;
        let params = [];

        let whereClauses = [];

        if (role === 'doctor') {
            // Doctor sees if they are related OR if it's their box (doctor_id)
            // But usually doctor_id matches their doctor profile id, not user_id directly (need lookup)
            // For simplicity, let's assume they only check their personal payments or rent?
            // Let's look up doctor ID.
            const doc = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (doc.length > 0) {
                whereClauses.push("(t.doctor_id = ? OR t.related_user_id = ?)");
                params.push(doc[0].id, user_id);
            } else {
                whereClauses.push("t.related_user_id = ?");
                params.push(user_id);
            }
        } else if (role === 'patient') {
            whereClauses.push("t.related_user_id = ?");
            params.push(user_id);
        } else {
            // Secretary
            if (doctor_id) {
                whereClauses.push("t.doctor_id = ?");
                params.push(doctor_id);
            }
            if (req.query.patient_id) {
                // If filtering by patient, look for related_user_id. 
                // However, we receive patient_id (patients table), but transactions use related_user_id (users table).
                // We need to look up the user_id for this patient first.
                const pat = await conn.query("SELECT user_id FROM patients WHERE id = ?", [req.query.patient_id]);
                if (pat.length > 0) {
                    whereClauses.push("t.related_user_id = ?");
                    params.push(pat[0].user_id);
                }
            }
        }

        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }

        query += " ORDER BY t.transaction_date DESC";

        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getStats = async (req, res) => {
    // Only Admin/Secretary
    let conn;
    try {
        const { doctor_id } = req.query;
        conn = await pool.getConnection();

        let query = `SELECT type, SUM(amount) as total FROM transactions`;
        let params = [];

        if (doctor_id) {
            query += " WHERE doctor_id = ?";
            params.push(doctor_id);
        }

        query += " GROUP BY type";

        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.closeCashBox = async (req, res) => {
    let conn;
    try {
        const { doctor_id, amount_delivered, description } = req.body;

        const amount = parseFloat(amount_delivered);
        if (isNaN(amount)) {
            return res.status(400).send("Invalid amount");
        }

        conn = await pool.getConnection();

        // Register withdrawal
        await conn.query(
            "INSERT INTO transactions (type, amount, description, doctor_id, status, is_withdrawal) VALUES ('withdrawal', ?, ?, ?, 'paid', TRUE)",
            [amount, description, doctor_id]
        );

        logAction(req, 'FINANCE_WITHDRAWAL', `Closed box for Doctor ID ${doctor_id}: delivered $${amount}`);
        res.status(201).send("Cash box closed successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};


exports.getPricing = async (req, res) => {
    let conn;
    try {
        const { doctor_id, patient_id, service_type } = req.query;
        if (!doctor_id) return res.status(400).send("Doctor ID required");

        conn = await pool.getConnection();

        const result = await calculatePrice(conn, doctor_id, patient_id, service_type);

        res.json({ price: result.price.toFixed(2), explanation: result.explanation });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

exports.payDebt = async (req, res) => {
    let conn;
    try {
        const { patient_id, amount, method, doctor_id } = req.body;

        // Basic validation
        let payAmount = parseFloat(amount);
        if (isNaN(payAmount) || payAmount <= 0) {
            return res.status(400).send("Invalid amount");
        }

        conn = await pool.getConnection();

        // 1. Get User ID linked to Patient
        const pat = await conn.query("SELECT user_id FROM patients WHERE id = ?", [patient_id]);
        if (pat.length === 0) return res.status(404).send("Patient not found");
        const userId = pat[0].user_id;

        // 2. Fetch Pending Debt Transactions (oldest first)
        const debts = await conn.query(
            "SELECT * FROM transactions WHERE related_user_id = ? AND status = 'pending' AND amount > 0 ORDER BY transaction_date ASC",
            [userId]
        );

        let remaining = payAmount;
        let totalPaid = 0;

        for (const debt of debts) {
            if (remaining <= 0.01) break; // Float tolerance

            const debtAmount = Number(debt.amount);

            if (remaining >= debtAmount) {
                // Full payment of this transaction
                await conn.query(
                    "UPDATE transactions SET status = 'paid', method = ?, description = CONCAT(description, ' - Paid') WHERE id = ?",
                    [method, debt.id]
                );

                // If this debt was linked to an appointment, it's now 'paid'
                if (debt.appointment_id) {
                    await conn.query("UPDATE appointments SET payment_status = 'paid', is_paid = 1 WHERE id = ?", [debt.appointment_id]);
                }
                remaining -= debtAmount;
                totalPaid += debtAmount;
            } else {
                // Partial payment: Split transaction
                // 1. Update existing to be the PAID portion
                await conn.query(
                    "UPDATE transactions SET status = 'paid', amount = ?, method = ?, description = CONCAT(description, ' - Paid Part') WHERE id = ?",
                    [remaining, method, debt.id]
                );

                // 2. Create new transaction for the REMAINDER (Pending)
                const remainder = debtAmount - remaining;
                await conn.query(
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date, request_id, appointment_id) VALUES (?, ?, ?, ?, ?, 'credit', 'pending', ?, ?, ?)",
                    [debt.type, remainder, debt.description, debt.related_user_id, debt.doctor_id, debt.transaction_date, debt.request_id, debt.appointment_id || null]
                );

                // If this debt was linked to an appointment, it's now 'partial'
                if (debt.appointment_id) {
                    await conn.query("UPDATE appointments SET payment_status = 'partial', is_paid = 0 WHERE id = ?", [debt.appointment_id]);
                }

                totalPaid += remaining;
                remaining = 0;
            }
        }

        // 3. Handle Overpayment (Excess amount)
        if (remaining > 0.01) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status) VALUES ('income_patient', ?, 'Advance Payment / Credit', ?, ?, ?, 'paid')",
                [remaining, userId, doctor_id || null, method]
            );
            totalPaid += remaining;
        }

        logAction(req, 'PAY_DEBT', `Paid $${payAmount} (Applied: $${totalPaid}) for Patient ID ${patient_id}`);
        res.json({ message: "Payment processed", paid: totalPaid });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
