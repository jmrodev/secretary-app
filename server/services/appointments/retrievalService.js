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

        let query = `
            SELECT 
                a.id, a.appointment_date, a.reason, a.status, a.payment_status,
                p.full_name as patient_name, d.full_name as doctor_name,
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE appointment_id = a.id AND type = 'income_patient' AND status = 'paid') as paid_amount,
                (SELECT GROUP_CONCAT(method) FROM transactions WHERE appointment_id = a.id AND type = 'income_patient' AND status = 'paid') as methods
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE MONTH(a.appointment_date) = ? AND YEAR(a.appointment_date) = ?
            AND a.status NOT IN ('cancelled', 'rescheduled')
        `;
        const params = [targetMonth, targetYear];
        if (doctorId) {
            query += " AND a.doctor_id = ?";
            params.push(doctorId);
        }
        query += " ORDER BY a.appointment_date ASC";

        const appointments = await pool.query(query, params);

        const report = {};
        appointments.forEach(a => {
            const dateStr = new Date(a.appointment_date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            if (!report[dateStr]) report[dateStr] = { fecha: dateStr, turnos: [], total_dia: 0 };

            report[dateStr].turnos.push({
                id: a.id,
                hora: new Date(a.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
                paciente: a.patient_name,
                motivo: a.reason,
                estado: a.status,
                pago: a.payment_status,
                monto: a.paid_amount,
                metodos: a.methods
            });
            report[dateStr].total_dia += Number(a.paid_amount);
        });

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

        // Other Income
        let otherIncomeQuery = `
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions 
            WHERE type = 'income_patient' AND status = 'paid' AND appointment_id IS NULL
            AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
        `;
        const oParams = [targetMonth, targetYear];
        if (doctorId) {
            otherIncomeQuery += " AND doctor_id = ?";
            oParams.push(doctorId);
        }
        const otherRes = await pool.query(otherIncomeQuery, oParams);

        return {
            appointments: Object.values(report),
            withdrawals: withdrawals.map(w => ({
                fecha: new Date(w.transaction_date).toLocaleDateString('es-AR'),
                monto: w.amount,
                descripcion: w.description
            })),
            other_income: Number(otherRes[0].total)
        };
    }
}

module.exports = new RetrievalService();
