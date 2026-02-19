const appointmentRepository = require('../../repositories/appointmentRepository');
const transactionRepository = require('../../repositories/transactionRepository');
const holidayRepository = require('../../repositories/holidayRepository');
const patientRepository = require('../../repositories/patientRepository');
const doctorRepository = require('../../repositories/doctorRepository');

class RetrievalService {
    async getAppointments(user, query) {
        const { role, user_id } = user;
        const filters = {
            patient_id: query.patientId,
            search: query.search
        };

        if (role === 'patient') {
            const patient = await patientRepository.findByUserId(user_id);
            if (patient) filters.patient_id = patient.id;
        } else if (role === 'doctor') {
            const doctor = await doctorRepository.findByUserId(user_id);
            if (doctor) filters.doctor_id = doctor.id;
        }

        return await appointmentRepository.getHistory(filters);
    }

    async getMonthlyReport(doctorId, month, year) {
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();

        // 0. Fetch Holidays
        const holidays = await holidayRepository.findActiveByMonth(targetMonth, targetYear);
        const holidayMap = {};
        holidays.forEach(h => {
            const d = new Date(h.date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            holidayMap[d] = h.description;
        });

        // 1. Fetch Appointments for the list
        const appointments = await appointmentRepository.findMonthlyAppointments(targetMonth, targetYear, doctorId);

        // 2. Fetch ALL Paid Income Transactions of the month (The real Cash Flow)
        const incomeTransactions = await transactionRepository.findMonthlyIncome(targetMonth, targetYear, doctorId);

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

        // Fill Appointments list (List only, don't use for totals yet)
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
            }
        });

        // Calculate Totals per Day based on ACTUAL Transactions (Cash Flow)
        incomeTransactions.forEach(t => {
            const dateStr = new Date(t.transaction_date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            if (report[dateStr]) {
                report[dateStr].total_paid += Number(t.amount);
                report[dateStr].total_dia += Number(t.amount); // total_dia used in some views as total_paid synonym
                if (t.method === 'cash' || t.method === 'efectivo') {
                    report[dateStr].total_efectivo += Number(t.amount);
                }
            }
        });

        const totalOther = incomeTransactions
            .filter(t => !t.appointment_id)
            .reduce((acc, t) => acc + Number(t.amount), 0);

        // Withdrawals
        const withdrawals = await transactionRepository.findMonthlyWithdrawals(targetMonth, targetYear, doctorId);

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
