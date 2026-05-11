const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const transactionRepository = require('../../repositories/finance/transactionRepository');
const holidayRepository = require('../../repositories/appointments/holidayRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');

class RetrievalService {
    async getAppointments(user, query) {
        const { role, user_id } = user;
        const filters = {
            search: query.search || '',
            status: query.status || null,
            start_date: query.startDate || null,
            end_date: query.endDate || null,
            page: parseInt(query.page) || 1,
            limit: parseInt(query.limit) || 50,
            patient_id: query.patientId || null
        };

        if (role === 'patient') {
            const patient = await patientRepository.findByUserId(user_id);
            if (patient) filters.patient_id = patient.id;
        } else if (role === 'doctor') {
            const doctor = await doctorRepository.findByUserId(user_id);
            if (doctor) filters.doctor_id = doctor.id;
        }

        return await appointmentRepository.searchAppointments(filters);
    }

    async getDailySchedule(doctorId, dateStr) {
        return await appointmentRepository.getDailySchedule(doctorId, dateStr);
    }

    async getMonthlyReport(doctorId, month, year) {
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();

        // 0. Fetch Holidays
        const holidays = await holidayRepository.findActiveByMonth(targetMonth, targetYear);
        const holidayMap = {};
        holidays.forEach(h => {
            const dateStrRaw = h.date instanceof Date ? h.date.toISOString().split('T')[0] : String(h.date).split(' ')[0];
            const dateObj = new Date(`${dateStrRaw}T12:00:00-03:00`); // Midday to be safe
            const d = dateObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            holidayMap[d] = h.description;
        });

        // 1. Fetch Appointments for the list
        const appointments = await appointmentRepository.findMonthlyAppointments(targetMonth, targetYear, doctorId);

        // 2. Fetch Pre-calculated Daily Summaries (The real SQL-First Cash Flow)
        const dailySummaries = await transactionRepository.findDailySummary(targetMonth, targetYear, doctorId);
        const summaryMap = {};
        dailySummaries.forEach(s => {
            const dateStrRaw = s.report_date instanceof Date ? s.report_date.toISOString().split('T')[0] : String(s.report_date).split(' ')[0];
            const dateObj = new Date(`${dateStrRaw}T12:00:00-03:00`);
            const dateStr = dateObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            summaryMap[dateStr] = s;
        });

        const report = {};
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStrRaw = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(`${dateStrRaw}T12:00:00-03:00`);
            const dateStr = dateObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            const dayOfWeek = dateObj.getDay();
            const daySummary = summaryMap[dateStr] || {};
            
            report[dateStr] = {
                date: dateStr,
                appointments: [],
                total_dia: Number(daySummary.total_income || 0),
                total_efectivo: Number(daySummary.total_cash || 0),
                total_paid: Number(daySummary.total_income || 0),
                total_withdrawal: Number(daySummary.total_withdrawal || 0),
                is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
                is_holiday: !!holidayMap[dateStr],
                holiday_description: holidayMap[dateStr] || null
            };
        }

        // Fill Appointments list (Visual only)
        appointments.forEach(a => {
            // Force parsing as Argentina time to avoid shifts if server is in UTC
            // MariaDB date strings like 'YYYY-MM-DD HH:mm:ss'
            const dateStrRaw = a.appointment_date instanceof Date 
                ? a.appointment_date.toISOString().replace('Z', '').replace('T', ' ')
                : String(a.appointment_date);
                
            // Append -03:00 to force the timezone regardless of server local time
            const dateObj = new Date(dateStrRaw.includes('-03:00') ? dateStrRaw : `${dateStrRaw} -03:00`);
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
                    doctor_id: a.doctor_id,
                    appointment_date: a.appointment_date,
                    hora: dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
                    nombre: finalName || 'Desconocido',
                    info: detail,
                    asistencia: a.status,
                    pago: a.payment_status,
                    monto_pagado: a.paid_amount,
                    monto_efectivo: a.paid_amount, 
                    debt_amount: a.pending_amount,
                    metodos_pago: '', 
                    dia: dateStr,
                    tipo_atencion: a.type,
                    is_overturn: !!a.is_out_of_hours
                });
            }
        });

        // Other income (not linked to appointments) is now inherently included in the daily summaries
        // If we still need to separate "Other", we can do it via a different view or query.
        const totalOther = 0; // Simplified for now since summary includes everything

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
