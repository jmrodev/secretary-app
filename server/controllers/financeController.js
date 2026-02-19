const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const googleController = require('./googleController');
const { calculatePrice } = require('../utils/priceCalculator');
const { formatLocalSQL, nowLocalSQL } = require('../utils/dateUtils');
const statsService = require('../services/finance/statsService');

// --- Consolidated Finances ---

exports.getPricing = async (req, res) => {
    let conn;
    try {
        const { doctor_id, patient_id, service_type } = req.query;
        if (!doctor_id) return res.status(400).send("Doctor ID required");
        conn = await pool.getConnection();
        const result = await calculatePrice(conn, doctor_id, patient_id, service_type);
        res.json({ price: result.price.toFixed(2), explanation: result.explanation });
    } catch (err) { console.error(err); res.status(500).send("Server Error: " + err.message); } finally { if (conn) conn.release(); }
};

/**
 * Creates a new financial transaction (Income, Expense, Withdrawal, etc.)
 * Supports split payments and debt generation.
 */
exports.createTransaction = async (req, res) => {
    let conn;
    try {
        const { type, amount, description, related_user_id, doctor_id, method, status, debt_amount, appointment_id, transaction_date, is_withdrawal } = req.body;
        let { payments } = req.body;
        const proof_file = req.file ? `/uploads/${req.file.filename}` : null;
        let result = {};

        if (payments && typeof payments === 'string') {
            try {
                payments = JSON.parse(payments);
            } catch (e) {
                console.error("Failed to parse payments JSON", e);
            }
        }

        conn = await pool.getConnection();

        // Format date for MariaDB using centralized utility
        const finalDate = formatLocalSQL(transaction_date) || nowLocalSQL();

        // 1. Clean up existing pending debt for this appointment/request to prevent duplicates
        if (appointment_id) {
            await conn.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [appointment_id]);
        }
        if (req.body.request_id) {
            await conn.query("DELETE FROM transactions WHERE request_id = ? AND status = 'pending'", [req.body.request_id]);
        }

        // 2. Register the Payments
        if (Array.isArray(payments) && payments.length > 0) {
            for (const p of payments) {
                if (Number(p.amount) > 0) {
                    // Logic: If split payment, append method to description for log clarity
                    const methodSuffix = payments.length > 1 ? ` [${(p.method || 'cash').toUpperCase()}]` : '';
                    const enrichedDescription = `${description}${methodSuffix}`;

                    result = await conn.query(
                        "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, institution_id, method, status, proof_file, request_id, appointment_id, transaction_date, is_withdrawal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [type, p.amount, enrichedDescription, related_user_id || null, doctor_id || null, req.body.institution_id || null, p.method || 'cash', status || 'paid', proof_file, req.body.request_id || null, appointment_id || null, finalDate, is_withdrawal || false]
                    );
                }
            }
        } else if (Number(amount) > 0) {
            // Fallback for single payment
            result = await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, institution_id, method, status, proof_file, request_id, appointment_id, transaction_date, is_withdrawal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [type, amount, description, related_user_id || null, doctor_id || null, req.body.institution_id || null, method || 'cash', status || 'paid', proof_file, req.body.request_id || null, appointment_id || null, finalDate, is_withdrawal || false]
            );
        }

        // 3. Register the Debt (if debt_amount > 0)
        if (Number(debt_amount) > 0) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, institution_id, method, status, proof_file, request_id, appointment_id, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [type, debt_amount, `DEBT: ${description}`, related_user_id || null, doctor_id || null, req.body.institution_id || null, 'on_account', 'pending', null, req.body.request_id || null, appointment_id || null, finalDate]
            );
        }

        // 4. Sync status with related entities
        if (appointment_id) await syncAppointmentPaymentStatus(conn, appointment_id, req.user?.user_id);
        if (req.body.request_id) await syncRequestPaymentStatus(conn, req.body.request_id);

        logAction(req, 'FINANCE_CREATE', `Created transaction: ${description} ($${amount || 'Multiple'})`);
        res.status(201).json({ message: "Transaction created successfully", id: result.insertId });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Retrieves transaction history with filters for user, doctor, and patient.
 */
exports.getTransactions = async (req, res) => {
    let conn;
    try {
        const { role, user_id } = req.user;
        const { doctor_id } = req.query;

        conn = await pool.getConnection();
        let query = `SELECT t.*, u.username as related_user_name, d.full_name as doctor_name, p.full_name as patient_full_name, p.dni as patient_dni,
                            i.cbte_nro as invoice_number, r.type as request_type
                     FROM transactions t 
                     LEFT JOIN users u ON t.related_user_id = u.id
                     LEFT JOIN doctors d ON t.doctor_id = d.id
                     LEFT JOIN patients p ON p.user_id = u.id
                     LEFT JOIN invoices i ON i.transaction_id = t.id
                     LEFT JOIN medical_requests r ON t.request_id = r.id
                     LEFT JOIN appointments a ON t.appointment_id = a.id`;
        const today = nowLocalSQL().split(' ')[0];
        let params = [today];
        let whereClauses = [
            "(t.status != 'pending' OR t.appointment_id IS NULL OR a.status = 'completed' OR (DATE(a.appointment_date) = ? AND a.status NOT IN ('cancelled', 'absent', 'reserved')))"
        ];

        if (role === 'doctor') {
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
            if (doctor_id) { whereClauses.push("t.doctor_id = ?"); params.push(doctor_id); }
            if (req.query.patient_id) {
                const pat = await conn.query("SELECT user_id FROM patients WHERE id = ?", [req.query.patient_id]);
                if (pat.length > 0) { whereClauses.push("t.related_user_id = ?"); params.push(pat[0].user_id); }
            }
            if (req.query.institution_id) { whereClauses.push("t.institution_id = ?"); params.push(req.query.institution_id); }
        }

        if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
        query += " ORDER BY t.transaction_date DESC LIMIT 1000";

        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Returns financial statistics grouped by type and period.
 * (Delegates calculation logic to statsService for better maintainability)
 */
exports.getStats = async (req, res) => {
    try {
        const { doctor_id } = req.query;
        const stats = await statsService.getDetailedStats(doctor_id);

        const result = [
            { type: 'cash', today: stats.todayCash, month: stats.monthCash, year: stats.yearCash },
            { type: 'transfer', today: stats.todayTransfer, month: stats.monthTransfer, year: stats.yearTransfer },
            { type: 'withdrawal', today: stats.todayWithdrawal, month: stats.monthWithdrawal, year: stats.yearWithdrawal },
            { type: 'expenses', today: stats.expenseToday, month: stats.expenseMonth, year: stats.expenseYear },
            {
                type: 'appointments',
                today: stats.appointments.today,
                month: stats.appointments.month,
                year: stats.appointments.year,
                debt: stats.appointments.debt
            },
            {
                type: 'prescriptions',
                today: stats.prescriptions.today.paid,
                month: stats.prescriptions.month.paid,
                year: stats.prescriptions.year.paid,
                debt: stats.prescriptions.month.debt,
                count: stats.prescriptions.month.count
            },
            {
                type: 'licenses',
                today: stats.licenses.today.paid,
                month: stats.licenses.month.paid,
                year: stats.licenses.year.paid,
                debt: stats.licenses.month.debt,
                count: stats.licenses.month.count
            },
            {
                type: 'certificates',
                today: stats.certificates.today.paid,
                month: stats.certificates.month.paid,
                year: stats.certificates.year.paid,
                debt: stats.certificates.month.debt,
                count: stats.certificates.month.count
            },
            { type: 'pending_debt', total: stats.totalDebt },
            {
                type: 'net_cash',
                today: (stats.todayCash + stats.todayTransfer) - stats.todayWithdrawal - stats.expenseToday,
                month: (stats.monthCash + stats.monthTransfer) - stats.monthWithdrawal - stats.expenseMonth,
                year: (stats.yearCash + stats.yearTransfer) - stats.yearWithdrawal - stats.expenseYear
            }
        ];

        res.json(result);
    } catch (err) {
        console.error('getStats error:', err);
        res.status(500).json({ error: 'Server Error', message: err.message });
    }
};

exports.closeCashBox = async (req, res) => {
    let conn;
    try {
        const { doctor_id, amount_delivered, description } = req.body;
        const amount = parseFloat(amount_delivered);
        if (isNaN(amount)) return res.status(400).send("Invalid amount");
        conn = await pool.getConnection();
        await conn.query("INSERT INTO transactions (type, amount, description, doctor_id, status, is_withdrawal) VALUES ('withdrawal', ?, ?, ?, 'paid', TRUE)", [amount, description, doctor_id]);
        logAction(req, 'FINANCE_WITHDRAWAL', `Closed box for Doctor ID ${doctor_id}: delivered $${amount}`);
        res.status(201).send("Cash box closed successfully");
    } catch (err) { console.error(err); res.status(500).send("Server Error"); } finally { if (conn) conn.release(); }
};

exports.payDebt = async (req, res) => {
    let conn;
    try {
        const { patient_id, amount, method, doctor_id } = req.body;
        let payAmount = parseFloat(amount);
        if (isNaN(payAmount) || payAmount <= 0) return res.status(400).send("Invalid amount");
        conn = await pool.getConnection();
        const pat = await conn.query("SELECT user_id, full_name FROM patients WHERE id = ?", [patient_id]);
        if (pat.length === 0) return res.status(404).send("Patient not found");
        const userId = pat[0].user_id;

        const debts = await conn.query("SELECT * FROM transactions WHERE related_user_id = ? AND status = 'pending' AND amount > 0 ORDER BY transaction_date ASC", [userId]);
        let remaining = payAmount;
        let totalPaid = 0;

        for (const debt of debts) {
            if (remaining <= 0.01) break;
            const debtAmount = Number(debt.amount);
            if (remaining >= debtAmount) {
                await conn.query("UPDATE transactions SET status = 'paid', method = ?, description = CONCAT(description, ' - Paid') WHERE id = ?", [method, debt.id]);
                if (debt.appointment_id) await syncAppointmentPaymentStatus(conn, debt.appointment_id, req.user?.user_id);
                if (debt.request_id) await syncRequestPaymentStatus(conn, debt.request_id);
                remaining -= debtAmount;
                totalPaid += debtAmount;
            } else {
                await conn.query("UPDATE transactions SET status = 'paid', amount = ?, method = ?, description = CONCAT(description, ' - Paid Part') WHERE id = ?", [remaining, method, debt.id]);
                const remainder = debtAmount - remaining;
                await conn.query("INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date, request_id, appointment_id) VALUES (?, ?, ?, ?, ?, 'on_account', 'pending', ?, ?, ?)", [debt.type, remainder, debt.description, debt.related_user_id, debt.doctor_id, debt.transaction_date, debt.request_id, debt.appointment_id || null]);
                if (debt.appointment_id) await syncAppointmentPaymentStatus(conn, debt.appointment_id, req.user?.user_id);
                if (debt.request_id) await syncRequestPaymentStatus(conn, debt.request_id);
                totalPaid += remaining;
                remaining = 0;
            }
        }
        if (remaining > 0.01) {
            await conn.query("INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status) VALUES ('income_patient', ?, 'Advance Payment / Credit', ?, ?, ?, 'paid')", [remaining, userId, doctor_id || null, method]);
            totalPaid += remaining;
        }
        res.json({ message: "Payment processed", paid: totalPaid });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); } finally { if (conn) conn.release(); }
};

exports.payInstitutionDebt = async (req, res) => {
    let conn;
    try {
        const { institution_id, amount, method, doctor_id } = req.body;
        let payAmount = parseFloat(amount);
        if (isNaN(payAmount) || payAmount <= 0) return res.status(400).send("Invalid amount");
        conn = await pool.getConnection();
        const debts = await conn.query("SELECT * FROM transactions WHERE institution_id = ? AND status = 'pending' AND amount > 0 ORDER BY transaction_date ASC", [institution_id]);
        let remaining = payAmount;
        let totalPaid = 0;
        for (const debt of debts) {
            if (remaining <= 0.01) break;
            const debtAmount = Number(debt.amount);
            if (remaining >= debtAmount) {
                await conn.query("UPDATE transactions SET status = 'paid', method = ?, description = CONCAT(description, ' - Paid by Inst') WHERE id = ?", [method, debt.id]);
                if (debt.appointment_id) await syncAppointmentPaymentStatus(conn, debt.appointment_id, req.user?.user_id);
                if (debt.request_id) await syncRequestPaymentStatus(conn, debt.request_id);
                remaining -= debtAmount;
                totalPaid += debtAmount;
            } else {
                await conn.query("UPDATE transactions SET status = 'paid', amount = ?, method = ?, description = CONCAT(description, ' - Paid Part by Inst') WHERE id = ?", [remaining, method, debt.id]);
                const remainder = debtAmount - remaining;
                await conn.query("INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, institution_id, method, status, transaction_date, request_id, appointment_id) VALUES (?, ?, ?, ?, ?, ?, 'on_account', 'pending', ?, ?, ?)", [debt.type, remainder, debt.description, debt.related_user_id, debt.doctor_id, debt.institution_id, debt.transaction_date, debt.request_id, debt.appointment_id || null]);
                if (debt.appointment_id) await syncAppointmentPaymentStatus(conn, debt.appointment_id, req.user?.user_id);
                if (debt.request_id) await syncRequestPaymentStatus(conn, debt.request_id);
                totalPaid += remaining;
                remaining = 0;
            }
        }
        res.json({ message: "Institution payment processed", paid: totalPaid });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); } finally { if (conn) conn.release(); }
};

exports.updateTransaction = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { amount, description, method, status, transaction_date } = req.body;
        conn = await pool.getConnection();
        const [oldTx] = await conn.query("SELECT * FROM transactions WHERE id = ?", [id]);
        if (!oldTx) return res.status(404).send("Transaction not found");
        const finalDate = formatLocalSQL(transaction_date) || formatLocalSQL(oldTx.transaction_date);
        await conn.query("UPDATE transactions SET amount = ?, description = ?, method = ?, status = ?, transaction_date = ? WHERE id = ?", [amount, description, method, status, finalDate, id]);
        if (oldTx.appointment_id) await syncAppointmentPaymentStatus(conn, oldTx.appointment_id, req.user?.user_id);
        logAction(req, 'FINANCE_UPDATE', `Updated transaction ${id}`);
        res.json({ message: 'Transaction updated successfully' });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); } finally { if (conn) conn.release(); }
};

exports.deleteTransaction = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();
        const [oldTx] = await conn.query("SELECT * FROM transactions WHERE id = ?", [id]);
        if (!oldTx) return res.status(404).send("Transaction not found");
        await conn.query("DELETE FROM transactions WHERE id = ?", [id]);
        if (oldTx.appointment_id) await syncAppointmentPaymentStatus(conn, oldTx.appointment_id, req.user?.user_id);
        if (oldTx.request_id) await syncRequestPaymentStatus(conn, oldTx.request_id);
        logAction(req, 'FINANCE_DELETE', `Deleted transaction ${id}`);
        res.json({ message: "Transaction deleted" });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); } finally { if (conn) conn.release(); }
};

async function syncAppointmentPaymentStatus(conn, appointmentId, userId) {
    const txs = await conn.query("SELECT amount, status FROM transactions WHERE appointment_id = ?", [appointmentId]);
    let totalPaid = 0, totalPending = 0;
    txs.forEach(t => { if (t.status === 'paid') totalPaid += Number(t.amount); else if (t.status === 'pending') totalPending += Number(t.amount); });
    let finalStatus = (totalPaid > 0 && totalPending > 0) ? 'partial' : (totalPaid > 0 ? 'paid' : (totalPending > 0 ? 'debt' : 'pending'));
    await conn.query("UPDATE appointments SET payment_status = ?, is_paid = ? WHERE id = ?", [finalStatus, finalStatus === 'paid' ? 1 : 0, appointmentId]);
}

async function syncRequestPaymentStatus(conn, requestId) {
    const txs = await conn.query("SELECT amount, status FROM transactions WHERE request_id = ?", [requestId]);
    let totalPaid = 0, totalPending = 0;
    txs.forEach(t => { if (t.status === 'paid') totalPaid += Number(t.amount); else if (t.status === 'pending') totalPending += Number(t.amount); });
    let finalStatus = (totalPaid > 0 && totalPending > 0) ? 'partial' : (totalPaid > 0 ? 'paid' : (totalPending > 0 ? 'debt' : 'pending'));
    await conn.query("UPDATE medical_requests SET payment_status = ?, debt_amount = ? WHERE id = ?", [finalStatus, totalPending, requestId]);
}
