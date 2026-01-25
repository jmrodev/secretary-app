const { pool } = require('../db');
const { logAction } = require('../utils/audit');
const googleController = require('./googleController');
const { calculatePrice } = require('../utils/priceCalculator');

// --- Consolidated Finances ---

exports.createTransaction = async (req, res) => {
    let conn;
    try {
        // type: income_patient, income_rental, expense_general, payment_doctor, withdrawal
        // related_user_id: Patient or Doctor interacting
        // doctor_id: Beneficiary of the cash box
        const { type, amount, description, related_user_id, doctor_id, method, status, debt_amount, appointment_id, transaction_date } = req.body;
        let { payments } = req.body;
        const proof_file = req.file ? `/uploads/${req.file.filename}` : null;

        if (payments && typeof payments === 'string') {
            try {
                payments = JSON.parse(payments);
            } catch (e) {
                console.error("Failed to parse payments JSON", e);
            }
        }

        conn = await pool.getConnection();

        // [FIX] Clean up existing pending debt for this appointment (if any) to prevent duplicates
        if (appointment_id) {
            await conn.query("DELETE FROM transactions WHERE appointment_id = ? AND status = 'pending'", [appointment_id]);
        }

        // 1. Register the Payments
        if (Array.isArray(payments) && payments.length > 0) {
            for (const p of payments) {
                if (Number(p.amount) > 0) {
                    await conn.query(
                        "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, institution_id, method, status, proof_file, request_id, appointment_id, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [type, p.amount, description, related_user_id || null, doctor_id || null, req.body.institution_id || null, p.method || 'cash', status || 'paid', proof_file, req.body.request_id || null, appointment_id || null, transaction_date || new Date()]
                    );
                }
            }
        } else if (Number(amount) > 0) {
            // Fallback for single payment
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, institution_id, method, status, proof_file, request_id, appointment_id, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [type, amount, description, related_user_id || null, doctor_id || null, req.body.institution_id || null, method || 'cash', status || 'paid', proof_file, req.body.request_id || null, appointment_id || null, transaction_date || new Date()]
            );
        }

        // 2. Register the Debt (if debt_amount > 0)
        if (Number(debt_amount) > 0) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, institution_id, method, status, proof_file, request_id, appointment_id, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [type, debt_amount, `DEBT: ${description}`, related_user_id || null, doctor_id || null, req.body.institution_id || null, 'on_account', 'pending', null, req.body.request_id || null, appointment_id || null, transaction_date || new Date()]
            );
        }

        // 3. Update Appointment payment_status if apptId is provided
        if (appointment_id) {
            const finalStatus = Number(debt_amount) > 0 ? (Number(amount) > 0 ? 'partial' : 'debt') : 'paid';
            const isPaid = finalStatus === 'paid' ? 1 : 0;
            await conn.query("UPDATE appointments SET payment_status = ?, is_paid = ? WHERE id = ?", [finalStatus, isPaid, appointment_id]);

            // --- Google Calendar Sync ---
            const [appt] = await conn.query("SELECT * FROM appointments WHERE id = ?", [appointment_id]);
            if (appt && appt.google_event_id) {
                const patData = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [appt.patient_id]);
                const pName = patData.length > 0 ? patData[0].full_name : appt.patient_id;
                const pDetails = patData.length > 0 ? patData[0] : {};

                const newDescription = `Motivo: ${appt.reason || 'N/A'}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: ${appt.status}\nPago: ${finalStatus}\nCreado por Aplicación de Secretaría`;

                const updatePayload = {
                    summary: `Consultorio: ${pName} [${finalStatus === 'debt' ? 'DEUDA' : (finalStatus === 'paid' ? 'PAGADO' : 'PARCIAL')}]`,
                    status: appt.status,
                    paymentStatus: finalStatus,
                    description: newDescription
                };

                try {
                    const result = await googleController.updateEventHelper(appt.doctor_id, appt.google_event_id, updatePayload, req.user?.user_id);
                    if (!result) throw new Error("Sync failed (returned null)");
                } catch (syncErr) {
                    console.warn("Google Sync Failed (Finance Transaction Update), queueing retry:", syncErr.message);
                    await conn.query(
                        "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'update', ?, 'pending')",
                        [appointment_id, appt.doctor_id, JSON.stringify({ eventId: appt.google_event_id, updates: updatePayload })]
                    );
                }
            }
            // ----------------------------
        }

        // Calculate total for logging if using multiple payments
        let effectiveAmount = amount;
        if (!effectiveAmount && Array.isArray(payments)) {
            effectiveAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        }

        let logDetail = `${type}: $${effectiveAmount} - ${description}`;
        if (Number(debt_amount) > 0) logDetail += ` (Debt: $${debt_amount})`;

        // [NEW] Enrich Log with Appointment/Patient Details
        if (appointment_id) {
            try {
                const [apptDetails] = await conn.query(`
                    SELECT a.appointment_date, a.type, p.full_name as patient_name, d.full_name as doctor_name 
                    FROM appointments a
                    LEFT JOIN patients p ON a.patient_id = p.id
                    LEFT JOIN doctors d ON a.doctor_id = d.id
                    WHERE a.id = ?
                `, [appointment_id]);

                if (apptDetails) {
                    const dateStr = new Date(apptDetails.appointment_date).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
                    logDetail += ` [Patient: ${apptDetails.patient_name}] [Dr: ${apptDetails.doctor_name}] [Type: ${apptDetails.type}] [Date: ${dateStr}]`;
                }
            } catch (e) { console.warn("Log enrichment failed", e); }
        } else if (related_user_id) {
            // Fallback if not linked to appointment directly but to user
            try {
                const [u] = await conn.query("SELECT username FROM users WHERE id = ?", [related_user_id]);
                if (u) logDetail += ` [User: ${u.username}]`;
            } catch (e) { }
        }

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
        let query = `SELECT t.*, u.username as related_user_name, d.full_name as doctor_name, p.full_name as patient_full_name, p.dni as patient_dni
                     FROM transactions t 
                     LEFT JOIN users u ON t.related_user_id = u.id
                     LEFT JOIN doctors d ON t.doctor_id = d.id
                     LEFT JOIN patients p ON p.user_id = u.id`;
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
            if (req.query.institution_id) {
                whereClauses.push("t.institution_id = ?");
                params.push(req.query.institution_id);
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
        const pat = await conn.query("SELECT user_id, full_name FROM patients WHERE id = ?", [patient_id]);
        if (pat.length === 0) return res.status(404).send("Patient not found");
        const userId = pat[0].user_id;
        const patientName = pat[0].full_name;

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

                    // Sync to Google
                    const [appt] = await conn.query("SELECT * FROM appointments WHERE id = ?", [debt.appointment_id]);
                    if (appt && appt.google_event_id) {
                        const patData = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [patient_id]);
                        const pName = patData.length > 0 ? patData[0].full_name : patient_id;
                        const pDetails = patData.length > 0 ? patData[0] : {};

                        const newDescription = `Motivo: ${appt.reason || 'N/A'}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: ${appt.status}\nPago: pagado\nCreado por Aplicación de Secretaría`;

                        const updatePayload = {
                            summary: `Consultorio: ${pName} [PAGADO]`,
                            status: appt.status,
                            paymentStatus: 'paid',
                            description: newDescription
                        };

                        try {
                            const result = await googleController.updateEventHelper(appt.doctor_id, appt.google_event_id, updatePayload, req.user?.user_id);
                            if (!result) throw new Error("Sync failed (returned null)");
                        } catch (syncErr) {
                            console.warn("Google Sync Failed (Finance Update - Paid), queueing retry:", syncErr.message);
                            await conn.query(
                                "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'update', ?, 'pending')",
                                [debt.appointment_id, appt.doctor_id, JSON.stringify({ eventId: appt.google_event_id, updates: updatePayload })]
                            );
                        }
                    }
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
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, method, status, transaction_date, request_id, appointment_id) VALUES (?, ?, ?, ?, ?, 'on_account', 'pending', ?, ?, ?)",
                    [debt.type, remainder, debt.description, debt.related_user_id, debt.doctor_id, debt.transaction_date, debt.request_id, debt.appointment_id || null]
                );

                // If this debt was linked to an appointment, it's now 'partial'
                if (debt.appointment_id) {
                    await conn.query("UPDATE appointments SET payment_status = 'partial', is_paid = 0 WHERE id = ?", [debt.appointment_id]);

                    // Sync to Google
                    const [appt] = await conn.query("SELECT * FROM appointments WHERE id = ?", [debt.appointment_id]);
                    if (appt && appt.google_event_id) {
                        const patData = await conn.query("SELECT full_name, dni, phone, email FROM patients WHERE id = ?", [patient_id]);
                        const pName = patData.length > 0 ? patData[0].full_name : patient_id;
                        const pDetails = patData.length > 0 ? patData[0] : {};

                        const newDescription = `Motivo: ${appt.reason || 'N/A'}\nPaciente: ${pName} (DNI: ${pDetails.dni || 'N/A'})\nTeléfono: ${pDetails.phone || 'N/A'}\nEmail: ${pDetails.email || 'N/A'}\nEstado: ${appt.status}\nPago: parcial\nCreado por Aplicación de Secretaría`;

                        const updatePayload = {
                            summary: `Consultorio: ${pName} [PARCIAL]`,
                            status: appt.status,
                            paymentStatus: 'partial',
                            description: newDescription
                        };

                        try {
                            const result = await googleController.updateEventHelper(appt.doctor_id, appt.google_event_id, updatePayload, req.user?.user_id);
                            if (!result) throw new Error("Sync failed (returned null)");
                        } catch (syncErr) {
                            console.warn("Google Sync Failed (Finance Update - Partial), queueing retry:", syncErr.message);
                            await conn.query(
                                "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'update', ?, 'pending')",
                                [debt.appointment_id, appt.doctor_id, JSON.stringify({ eventId: appt.google_event_id, updates: updatePayload })]
                            );
                        }
                    }
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

        logAction(req, 'PAY_DEBT', `Paid $${payAmount} (Applied: $${totalPaid}) for Patient: ${patientName} (ID: ${patient_id})`);
        res.json({ message: "Payment processed", paid: totalPaid });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.payInstitutionDebt = async (req, res) => {
    let conn;
    try {
        const { institution_id, amount, method, doctor_id } = req.body;

        let payAmount = parseFloat(amount);
        if (isNaN(payAmount) || payAmount <= 0) {
            return res.status(400).send("Invalid amount");
        }

        conn = await pool.getConnection();

        // 1. Fetch Pending Debt Transactions for this Institution
        const debts = await conn.query(
            "SELECT * FROM transactions WHERE institution_id = ? AND status = 'pending' AND amount > 0 ORDER BY transaction_date ASC",
            [institution_id]
        );

        let remaining = payAmount;
        let totalPaid = 0;

        for (const debt of debts) {
            if (remaining <= 0.01) break;

            const debtAmount = Number(debt.amount);

            if (remaining >= debtAmount) {
                // Full payment of this line
                await conn.query(
                    "UPDATE transactions SET status = 'paid', method = ?, description = CONCAT(description, ' - Paid by Inst') WHERE id = ?",
                    [method, debt.id]
                );
                remaining -= debtAmount;
                totalPaid += debtAmount;
            } else {
                // Partial payment: Split transaction
                await conn.query(
                    "UPDATE transactions SET status = 'paid', amount = ?, method = ?, description = CONCAT(description, ' - Paid Part by Inst') WHERE id = ?",
                    [remaining, method, debt.id]
                );

                const remainder = debtAmount - remaining;
                await conn.query(
                    "INSERT INTO transactions (type, amount, description, related_user_id, doctor_id, institution_id, method, status, transaction_date, request_id, appointment_id) VALUES (?, ?, ?, ?, ?, ?, 'on_account', 'pending', ?, ?, ?)",
                    [debt.type, remainder, debt.description, debt.related_user_id, debt.doctor_id, debt.institution_id, debt.transaction_date, debt.request_id, debt.appointment_id || null]
                );

                totalPaid += remaining;
                remaining = 0;
            }
        }

        // Handle Overpayment
        if (remaining > 0.01) {
            await conn.query(
                "INSERT INTO transactions (type, amount, description, institution_id, doctor_id, method, status) VALUES ('income_patient', ?, 'Advance Payment / Credit (Inst)', ?, ?, ?, 'paid')",
                [remaining, institution_id, doctor_id || null, method]
            );
            totalPaid += remaining;
        }

        logAction(req, 'PAY_INSTITUTION_DEBT', `Institution ID ${institution_id} paid $${payAmount}`);
        res.json({ message: "Institution payment processed", paid: totalPaid });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.updateTransaction = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { amount, description, method, status, transaction_date } = req.body;
        conn = await pool.getConnection();

        // 1. Get current transaction to see if it's linked to an appointment
        const [oldTx] = await conn.query("SELECT * FROM transactions WHERE id = ?", [id]);
        if (!oldTx) return res.status(404).send("Transaction not found");

        if (req.user.role === 'secretary') {
            const [setting] = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_finance_crud'");
            if (!setting || setting.setting_value !== 'true') {
                return res.status(403).send("Acceso denegado: CRUD de finanzas deshabilitado para secretarias.");
            }
        }

        // 2. Update the transaction
        await conn.query(
            "UPDATE transactions SET amount = ?, description = ?, method = ?, status = ?, transaction_date = ? WHERE id = ?",
            [amount, description, method, status, transaction_date || oldTx.transaction_date, id]
        );

        // 3. If linked to an appointment, re-calculate the payment status
        if (oldTx.appointment_id) {
            await syncAppointmentPaymentStatus(conn, oldTx.appointment_id, req.user?.user_id);
        }

        logAction(req, 'FINANCE_UPDATE', `Updated transaction ${id}: $${amount} - ${description}`);
        res.json({ message: "Transaction updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.deleteTransaction = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();

        // 1. Get current transaction info
        const [oldTx] = await conn.query("SELECT * FROM transactions WHERE id = ?", [id]);
        if (!oldTx) return res.status(404).send("Transaction not found");

        if (req.user.role === 'secretary') {
            const [setting] = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_finance_crud'");
            if (!setting || setting.setting_value !== 'true') {
                return res.status(403).send("Acceso denegado: CRUD de finanzas deshabilitado para secretarias.");
            }
        }

        // 2. Delete
        await conn.query("DELETE FROM transactions WHERE id = ?", [id]);

        // 3. If linked to an appointment, re-calculate
        if (oldTx.appointment_id) {
            await syncAppointmentPaymentStatus(conn, oldTx.appointment_id, req.user?.user_id);
        }

        logAction(req, 'FINANCE_DELETE', `Deleted transaction ${id}: $${oldTx.amount} - ${oldTx.description}`);
        res.json({ message: "Transaction deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

// Helper function to re-calculate appointment payment status based on all its transactions
async function syncAppointmentPaymentStatus(conn, appointmentId, userId) {
    // Check if it's a patient or institution appointment? 
    // For now, we look at ALL transactions for this appointment_id.
    const txs = await conn.query("SELECT amount, status FROM transactions WHERE appointment_id = ?", [appointmentId]);

    let totalPaid = 0;
    let totalPending = 0;
    txs.forEach(t => {
        if (t.status === 'paid') totalPaid += Number(t.amount);
        else if (t.status === 'pending') totalPending += Number(t.amount);
    });

    let finalStatus = 'unpaid';
    if (totalPaid > 0 && totalPending > 0) finalStatus = 'partial';
    else if (totalPaid > 0 && totalPending === 0) finalStatus = 'paid';
    else if (totalPaid === 0 && totalPending > 0) finalStatus = 'debt';

    const isPaid = finalStatus === 'paid' ? 1 : 0;
    await conn.query("UPDATE appointments SET payment_status = ?, is_paid = ? WHERE id = ?", [finalStatus, isPaid, appointmentId]);

    // Google Sync
    const [appt] = await conn.query("SELECT * FROM appointments WHERE id = ?", [appointmentId]);
    if (appt && appt.google_event_id) {
        const patData = await conn.query("SELECT full_name, dni FROM patients WHERE id = ?", [appt.patient_id]);
        const pName = patData.length > 0 ? patData[0].full_name : 'Paciente';

        const updatePayload = {
            summary: `Consultorio: ${pName} [${finalStatus === 'debt' ? 'DEUDA' : (finalStatus === 'paid' ? 'PAGADO' : 'PARCIAL')}]`,
            paymentStatus: finalStatus
        };

        try {
            await googleController.updateEventHelper(appt.doctor_id, appt.google_event_id, updatePayload, userId);
        } catch (syncErr) {
            console.warn("Google Sync Failed (Sync Recompute), queueing retry:", syncErr.message);
            await conn.query(
                "INSERT INTO google_sync_queue (appointment_id, doctor_id, action, payload, status) VALUES (?, ?, 'update', ?, 'pending')",
                [appointmentId, appt.doctor_id, JSON.stringify({ eventId: appt.google_event_id, updates: updatePayload })]
            );
        }
    }
}
