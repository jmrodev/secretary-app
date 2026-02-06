const appointmentRepository = require('../../repositories/appointmentRepository');
const { pool } = require('../../db');

class RetrievalService {
    async getAppointments(user, query) {
        const { role, user_id } = user;
        const filters = {
            patient_id: query.patientId,
            search: query.search
        };

        if (role === 'patient') {
            const [pRows] = await pool.query("SELECT id FROM patients WHERE user_id = ?", [user_id]);
            if (pRows) filters.patient_id = pRows.id;
        } else if (role === 'doctor') {
            const [dRows] = await pool.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (dRows) filters.doctor_id = dRows.id;
        }

        return await appointmentRepository.getHistory(filters);
    }

    async getMonthlyReport(doctorId, month, year) {
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();

        // 0. Fetch Holidays
        const holidays = await pool.query(
            "SELECT date, description FROM active_holidays WHERE MONTH(date) = ? AND YEAR(date) = ?",
            [targetMonth, targetYear]
        );
        const holidayMap = {};
        holidays.forEach(h => {
            const d = new Date(h.date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            holidayMap[d] = h.description;
        });

        let query = `
            SELECT 
                a.id, a.appointment_date, a.reason, a.status, a.payment_status, a.type, a.is_out_of_hours,
                p.full_name as patient_name, d.full_name as doctor_name,
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE appointment_id = a.id AND is_withdrawal = 0 AND status = 'paid') as paid_amount,
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE appointment_id = a.id AND is_withdrawal = 0 AND status = 'paid' AND (method = 'cash' OR method = 'efectivo')) as cash_amount,
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE appointment_id = a.id AND is_withdrawal = 0 AND status = 'pending') as debt_amount,
                (SELECT GROUP_CONCAT(method) FROM transactions WHERE appointment_id = a.id AND is_withdrawal = 0 AND status = 'paid') as methods
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE MONTH(a.appointment_date) = ? AND YEAR(a.appointment_date) = ?
        `;
        const params = [targetMonth, targetYear];
        if (doctorId) {
            query += " AND a.doctor_id = ?";
            params.push(doctorId);
        }
        query += " ORDER BY a.appointment_date ASC";

        const appointments = await pool.query(query, params);

        const report = {};
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(targetYear, targetMonth - 1, d);
            const dateStr = dateObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            const dayOfWeek = dateObj.getDay();
            report[dateStr] = {
                date: dateStr,
                appointments: [],
                total_dia: 0,
                total_efectivo: 0,
                total_paid: 0,
                is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
                is_holiday: !!holidayMap[dateStr],
                holiday_description: holidayMap[dateStr] || null
            };
        }

        appointments.forEach(a => {
            const dateObj = new Date(a.appointment_date);
            const dateStr = dateObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

            let finalName = a.patient_name || (a.reason ? `(Sin Paciente) ${a.reason}` : 'Desconocido');
            const typeLabel = a.type === 'virtual' ? 'Virtual' : 'Presencial';
            let detail = `Consulta ${typeLabel}`;
            if (a.reason && a.reason.toLowerCase() !== 'consulta' && a.reason !== detail) {
                detail = a.reason;
            }

            if (report[dateStr]) {
                report[dateStr].appointments.push({
                    id: a.id,
                    hora: dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
                    nombre: finalName || 'Desconocido',
                    info: detail,
                    asistencia: a.status,
                    pago: a.payment_status,
                    monto_pagado: a.paid_amount,
                    monto_efectivo: a.cash_amount,
                    debt_amount: a.debt_amount,
                    metodos_pago: a.methods || '',
                    dia: dateStr,
                    tipo_atencion: a.type,
                    is_overturn: !!a.is_out_of_hours
                });
                report[dateStr].total_dia += Number(a.paid_amount);
                report[dateStr].total_efectivo += Number(a.cash_amount);
                report[dateStr].total_paid += Number(a.paid_amount);
            }
        });

        // Other Income (Granular to catch cash)
        let otherTransactionsQuery = `
            SELECT amount, method, transaction_date, description FROM transactions 
            WHERE is_withdrawal = 0 AND status = 'paid' AND appointment_id IS NULL
            AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
        `;
        const oParams = [targetMonth, targetYear];
        if (doctorId) {
            otherTransactionsQuery += " AND doctor_id = ?";
            oParams.push(doctorId);
        }
        const otherTrans = await pool.query(otherTransactionsQuery, oParams);

        // Distribute other income into daily cash if applicable
        otherTrans.forEach(ot => {
            const dateStr = new Date(ot.transaction_date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            if (report[dateStr]) {
                report[dateStr].total_paid += Number(ot.amount);
                if (ot.method === 'cash' || ot.method === 'efectivo') {
                    report[dateStr].total_efectivo += Number(ot.amount);
                }
            }
        });

        const totalOther = otherTrans.reduce((acc, ot) => acc + Number(ot.amount), 0);

        // Withdrawals
        let withdrawalsQuery = `
            SELECT amount, transaction_date, description FROM transactions 
            WHERE (type = 'withdrawal' OR type = 'payout') 
            AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? 
        `;
        const wParams = [targetMonth, targetYear];
        if (doctorId) {
            withdrawalsQuery += " AND doctor_id = ?";
            wParams.push(doctorId);
        }
        const withdrawals = await pool.query(withdrawalsQuery, wParams);

        return {
            appointments: Object.values(report),
            withdrawals: withdrawals.map(w => ({
                fecha: new Date(w.transaction_date).toLocaleDateString('es-AR'),
                monto: w.amount,
                descripcion: w.description
            })),
            other_income: Number(totalOther)
        };
    }
}

module.exports = new RetrievalService();
