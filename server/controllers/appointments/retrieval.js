const { pool } = require('../../db');

exports.getAppointments = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { role, user_id } = req.user;
        let query = `
            SELECT a.*, p.full_name as patient_name, p.dni as patient_dni, p.user_id as patient_user_id, p.behavior_rating, 
            (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t LEFT JOIN appointments a2 ON t.appointment_id = a2.id WHERE t.related_user_id = p.user_id AND t.status = 'pending' AND (t.appointment_id IS NULL OR a2.status IN ('completed', 'attended', 'arrived', 'absent'))) as total_debt,
            (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.appointment_id = a.id AND t.status = 'paid') as paid_amount,
            (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.appointment_id = a.id AND t.status = 'pending') as pending_amount,
            (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = p.id) as total_appointments,
            (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = p.id AND (a2.status = 'absent' OR (a2.status = 'cancelled' AND COALESCE(a2.cancellation_reason, '') NOT LIKE '%error%'))) as missed_appointments,
            (SELECT GROUP_CONCAT(DISTINCT t.method) FROM transactions t WHERE t.appointment_id = a.id AND t.status = 'paid') as payment_methods,
            d.full_name as doctor_name, p.phone as patient_phone 
            FROM appointments a 
            LEFT JOIN patients p ON a.patient_id = p.id 
            JOIN doctors d ON a.doctor_id = d.id
        `;
        let params = [];

        if (role === 'patient') {
            const pRows = await conn.query("SELECT id FROM patients WHERE user_id = ?", [user_id]);
            if (pRows.length > 0) {
                query += " WHERE a.patient_id = ?";
                params.push(pRows[0].id);
            }
        } else if (role === 'doctor') {
            const dRows = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (dRows.length > 0) {
                query += " WHERE a.doctor_id = ?";
                params.push(dRows[0].id);
            }
        }
        // Secretary/Admin sees all

        console.log(`[getAppointments] Request from UserID: ${user_id}, Role: ${role}`);
        // [NEW] Filter by specific patient (for history view)
        if (req.query.patientId) {
            if (query.includes(' WHERE ')) {
                query += " AND a.patient_id = ?";
            } else {
                query += " WHERE a.patient_id = ?";
            }
            params.push(req.query.patientId);
        }

        // [NEW] Global Search Filter (Reason, Name, Phone)
        // If search term is provided, we might want to ignore date ranges entirely or search within them?
        // Usually "search" implies finding it anywhere. 
        // For now, let's append it to existing filters. If no filters exist, it searches all.
        if (req.query.search) {
            const searchTerm = `%${req.query.search}%`;
            const searchClause = "(p.full_name LIKE ? OR a.reason LIKE ? OR p.phone LIKE ?)";
            if (query.includes(' WHERE ')) {
                query += ` AND ${searchClause}`;
            } else {
                query += ` WHERE ${searchClause}`;
            }
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += " ORDER BY a.appointment_date DESC"; // Ensure history is ordered

        const rows = await conn.query(query, params);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getMonthlyReport = async (req, res) => {
    let conn;
    try {
        const { month, year, doctorId } = req.query;
        conn = await pool.getConnection();

        // Default to current month if not provided
        let targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        let targetYear = year ? parseInt(year) : new Date().getFullYear();

        console.log(`[getMonthlyReport] Generating report for Month: ${targetMonth}, Year: ${targetYear}, Doctor: ${doctorId || 'All'}`);

        let query = `
            SELECT 
                a.id,
                a.appointment_date,
                a.status as attendance,
                a.payment_status,
                a.reason,
                a.type as appointment_type,
                p.full_name as patient_name,
                COALESCE(SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END), 0) as paid_amount,
                COALESCE(SUM(CASE WHEN t.status = 'pending' OR t.status = 'debt' THEN t.amount ELSE 0 END), 0) as debt_amount,
                GROUP_CONCAT(DISTINCT t.method SEPARATOR ', ') as payment_methods
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN transactions t ON a.id = t.appointment_id
            WHERE MONTH(a.appointment_date) = ? AND YEAR(a.appointment_date) = ?
        `;

        const queryParams = [targetMonth, targetYear];

        if (doctorId) {
            query += " AND a.doctor_id = ?";
            queryParams.push(doctorId);
        }

        query += `
            GROUP BY a.id, a.appointment_date, a.status, a.payment_status, a.reason, a.type, p.full_name
            ORDER BY a.appointment_date ASC
        `;

        const rows = await conn.query(query, queryParams);
        console.log(`[getMonthlyReport] Found ${rows.length} appointments.`);

        // Group by Day
        const report = {};

        rows.forEach(row => {
            const dateObj = new Date(row.appointment_date);
            const dayKey = dateObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            const time = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });

            // Monday Check (Day 1 in JS getDay())
            const dayName = dateObj.toLocaleDateString('es-AR', { weekday: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).toLowerCase();
            const isMonday = dayName === 'lunes';

            if (!report[dayKey]) {
                report[dayKey] = {
                    date: dayKey,
                    appointments: []
                };
            }

            // Fallback Logic for Name
            let finalName = row.patient_name;
            if (!finalName || finalName === 'Unknown') {
                if (row.attendance === 'external' || row.attendance === 'google') {
                    // Use the reason (Google Summary) as the name
                    finalName = row.reason ? `Google: ${row.reason}` : 'Google Calendar / Externo';
                } else {
                    // Check if reason looks like a name (simple heuristic: not empty)
                    finalName = row.reason ? `${row.reason} (Sin Paciente)` : 'Desconocido';
                }
            }

            // Derive payment label from sums for robustness
            const calculatedStatus = (Number(row.paid_amount) > 0 && Number(row.debt_amount) > 0) ? 'partial' :
                (Number(row.paid_amount) > 0) ? 'paid' :
                    (Number(row.debt_amount) > 0) ? 'debt' : 'pending';

            report[dayKey].appointments.push({
                info: `Turno ID ${row.id}`,
                pago: calculatedStatus,
                asistencia: row.attendance,
                nombre: finalName,
                hora: time,
                dia: dayKey,
                monto_pagado: row.paid_amount,
                metodos_pago: row.payment_methods || '',
                es_lunes: isMonday,
                tipo_atencion: row.appointment_type,
                razon: row.reason || ''
            });
        });

        // Fetch Withdrawals (money given to doctor)
        let withdrawalsQuery = `
            SELECT 
                amount, 
                transaction_date, 
                description 
            FROM transactions 
            WHERE 
                (type = 'withdrawal' OR type = 'payout') 
                AND MONTH(transaction_date) = ? 
                AND YEAR(transaction_date) = ?
        `;

        const wParams = [targetMonth, targetYear];

        if (doctorId) {
            withdrawalsQuery += " AND doctor_id = ?";
            wParams.push(doctorId);
        }

        withdrawalsQuery += " ORDER BY transaction_date ASC";

        let withdrawals = [];
        try {
            withdrawals = await conn.query(withdrawalsQuery, wParams);
        } catch (wErr) {
            console.warn("Could not filter withdrawals by doctor_id (maybe column missing?):", wErr.message);
            // Fallback: try without doctor filter if it failed? No, improved safety:
            if (doctorId) {
                // Try legacy fallback or return empty list for safety
                withdrawals = [];
            } else {
                // If global, fetch all (using original query without doctor filter)
                withdrawals = await conn.query(`
                    SELECT amount, transaction_date, description FROM transactions 
                    WHERE (type = 'withdrawal' OR type = 'payout') 
                    AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? 
                    ORDER BY transaction_date ASC`, [targetMonth, targetYear]);
            }
        }

        // Format withdrawals
        const withdrawalList = withdrawals.map(w => {
            const dateObj = new Date(w.transaction_date);
            return {
                fecha: dateObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
                monto: w.amount,
                descripcion: w.description
            };
        });

        // Fetch Other Income (from Medical Requests or direct transactions)
        let otherIncomeQuery = `
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions 
            WHERE 
                type = 'income_patient' 
                AND status = 'paid'
                AND appointment_id IS NULL
                AND MONTH(transaction_date) = ? 
                AND YEAR(transaction_date) = ?
        `;
        const oParams = [targetMonth, targetYear];
        if (doctorId) {
            otherIncomeQuery += " AND doctor_id = ?";
            oParams.push(doctorId);
        }
        const otherIncomeRes = await conn.query(otherIncomeQuery, oParams);
        const otherIncome = Number(otherIncomeRes[0].total);

        const result = {
            appointments: Object.values(report),
            withdrawals: withdrawalList,
            other_income: otherIncome
        };

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};
