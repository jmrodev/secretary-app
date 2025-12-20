const { pool } = require('../db');
const { logAction } = require('../utils/audit');

// --- Consolidated Finances ---

exports.createTransaction = async (req, res) => {
    let conn;
    try {
        // type: income_patient, income_rental, expense_general, payment_doctor, withdrawal
        // related_user_id: Patient or Doctor interacting
        // doctor_id: Beneficiary of the cash box
        const { type, amount, description, related_user_id, doctor_id, method, status, debt_amount } = req.body;
        const proof_file = req.file ? `/uploads/${req.file.filename}` : null;

        conn = await pool.getConnection();

        // 1. Register the Payment (if amount > 0)
        // If amount is 0, it means they paid nothing now, everything is debt? 
        // Let's assume there's always a transaction record.
        if (Number(amount) > 0) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, proof_file, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [type, amount, description, related_user_id || null, doctor_id || null, method || 'cash', status || 'paid', proof_file, req.body.request_id || null]
            );
        }

        // 2. Register the Debt (if debt_amount > 0)
        if (Number(debt_amount) > 0) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, proof_file, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [type, debt_amount, `DEBT: ${description}`, related_user_id || null, doctor_id || null, 'credit', 'pending', null, req.body.request_id || null]
            );
        }

        let logDetail = `${type}: $${amount} - ${description}`;
        if (Number(debt_amount) > 0) logDetail += ` (Debt: $${debt_amount})`;

        logAction(req, 'FINANCE_TRANSACTION', logDetail);

        res.status(201).send("Transaction recorded");
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

        // Get Doctor Prices
        const rows = await conn.query("SELECT consultation_price, prescription_price, medical_license_price, virtual_consultation_price FROM doctors WHERE id = ?", [doctor_id]);

        let basePrice = 0;
        let priceType = 'Consultation';

        if (rows.length > 0) {
            const d = rows[0];
            switch (service_type) {
                case 'prescription':
                    basePrice = Number(d.prescription_price) || 0;
                    priceType = 'Prescription';
                    break;
                case 'medical_license':
                    basePrice = Number(d.medical_license_price) || 0;
                    priceType = 'Medical License';
                    break;
                case 'virtual_consultation':
                    basePrice = Number(d.virtual_consultation_price) || 0;
                    priceType = 'Virtual Consultation';
                    break;
                case 'consultation':
                default:
                    basePrice = Number(d.consultation_price) || 0;
                    priceType = 'Consultation';
                    break;
            }
        }

        let finalPrice = basePrice;
        let explanation = `${priceType} Base Price: $${basePrice}`;

        // Get Patient Tariff (apply to all or just consultation? Usually all medical acts)
        if (patient_id) {
            const patRows = await conn.query("SELECT tariff_percent, tariff_override FROM patients WHERE id = ?", [patient_id]);
            if (patRows.length > 0) {
                const { tariff_percent, tariff_override } = patRows[0];

                if (tariff_override !== null) {
                    // Tariff override usually replaces the standard consultation price. 
                    // For other services, maybe we shouldn't override? 
                    // Let's assume override applies to PRIMARY consultation, but maybe percentage applies to others?
                    // For simplicity, let's say override applies to standard consultation only, or maybe it's a "User Level" price?
                    // Let's apply percentage to everything, but override only if it's a standard consultation OR if we treat override as "the price this patient pays for a visit".
                    // If service_type is NOT consultation, maybe we ignore override?
                    // Let's stick to percentage for auxiliary services.

                    if (service_type === 'consultation' || !service_type) {
                        finalPrice = Number(tariff_override);
                        explanation += ` | Tariff Override: $${tariff_override}`;
                    } else {
                        // Apply percentage if exists
                        if (tariff_percent !== 0) {
                            const adjustment = basePrice * (tariff_percent / 100);
                            finalPrice += adjustment;
                            explanation += ` | Tariff Adjustment: ${tariff_percent}% ($${adjustment.toFixed(2)})`;
                        }
                    }
                } else if (tariff_percent !== 0) {
                    const adjustment = basePrice * (tariff_percent / 100);
                    finalPrice += adjustment;
                    explanation += ` | Tariff Adjustment: ${tariff_percent}% ($${adjustment.toFixed(2)})`;
                }
            }
        }

        res.json({ price: finalPrice.toFixed(2), explanation });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
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
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date, request_id) VALUES (?, ?, ?, ?, ?, 'credit', 'pending', ?, ?)",
                    [debt.type, remainder, debt.description, debt.related_user_id, debt.doctor_id, debt.transaction_date, debt.request_id]
                );

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
