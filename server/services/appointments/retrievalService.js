const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const transactionRepository = require('../../repositories/finance/transactionRepository');
const holidayRepository = require('../../repositories/appointments/holidayRepository');
const patientRepository = require('../../repositories/user/patientRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');

/**
 * ECC-Pattern: Domain Data Mapping (Immutability)
 */
const mapAppointment = (a) => ({
    id: a.id,
    appointment_date: a.appointment_date,
    doctor_id: a.doctor_id,
    doctor_name: a.doctor_name,
    patient_id: a.patient_id,
    patient_name: a.patient_name || (a.reason ? `(Sin Paciente) ${a.reason}` : 'Desconocido'),
    patient_phone: a.patient_phone || a.phone || '-',
    status: a.status,
    reason: a.reason || '-',
    type: a.type,
    is_out_of_hours: !!a.is_out_of_hours,
    paid_amount: Number(a.paid_amount || 0),
    pending_amount: Number(a.pending_amount || 0),
    cost: Number(a.cost || 0),
    payment_status: a.payment_status,
    is_paid: !!a.is_paid,
    rescheduled_from_date: a.rescheduled_from_date,
    created_at: a.created_at,
    confirmed_at: a.confirmed_at,
    arrived_at: a.arrived_at,
    completed_at: a.completed_at,
    paid_at: a.paid_at
});

/**
 * Specialized mapper for daily schedule slots
 */
const mapSlot = (s) => ({
    ...mapAppointment(s),
    slot_date: s.slot_date,
    slot_time: s.slot_time,
    slot_status: s.slot_status
});

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

        const { appointments, totalCount } = await appointmentRepository.searchAppointments(filters);
        return {
            appointments: appointments.map(mapAppointment),
            totalCount
        };
    }

    async getAppointmentById(id) {
        const appt = await appointmentRepository.findById(id);
        if (!appt) return null;
        return mapAppointment(appt);
    }

    async getDailySchedule(doctorId, dateStr) {
        const rows = await appointmentRepository.getDailySchedule(doctorId, dateStr);
        // Use mapSlot to preserve slot_time and slot_status
        return rows.map(mapSlot);
    }

    async getMonthlyReport(doctorId, month, year) {
        const doctor = await doctorRepository.findById(doctorId);
        if (!doctor) {
            const err = new Error("Doctor not found");
            err.statusCode = 404;
            throw err;
        }

        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();

        const [holidays, appointments, dailySummaries, withdrawals] = await Promise.all([
            holidayRepository.findActiveByMonth(targetMonth, targetYear),
            appointmentRepository.findMonthlyAppointments(targetMonth, targetYear, doctorId),
            transactionRepository.findDailySummary(targetMonth, targetYear, doctorId),
            transactionRepository.findMonthlyWithdrawals(targetMonth, targetYear, doctorId)
        ]);

        const holidayMap = {};
        holidays.forEach(h => {
            const d = new Date(h.date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            holidayMap[d] = h.description;
        });

        const summaryMap = {};
        dailySummaries.forEach(s => {
            const d = new Date(s.report_date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            summaryMap[d] = s;
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

        appointments.forEach(a => {
            const mapped = mapAppointment(a);
            const dateStr = new Date(mapped.appointment_date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
            if (report[dateStr]) report[dateStr].appointments.push(mapped);
        });

        return {
            appointments: Object.values(report),
            withdrawals: withdrawals.map(w => ({
                fecha: new Date(w.transaction_date).toLocaleDateString('es-AR'),
                monto: w.amount,
                descripcion: w.description
            })),
            other_income: 0
        };
    }
}

module.exports = new RetrievalService();
