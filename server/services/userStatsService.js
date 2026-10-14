const statsRepository = require('../repositories/statsRepository');
const doctorRepository = require('../repositories/doctorRepository');
const { formatDateLocal } = require('../utils/dateUtils');

/**
 * UserStatsService
 * Business logic for dashboard statistics.
 */
class UserStatsService {
    async getStats(user) {
        const { role, user_id } = user;

        const now = new Date();

        const todayStart = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        const todayEnd = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));

        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset));
        const weekEnd = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + 7));

        const monthStart = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1));
        const monthEnd = formatDateLocal(new Date(now.getFullYear(), now.getMonth() + 1, 1));

        let doctorId = null;
        if (role === 'doctor') {
            const doc = await doctorRepository.getDoctorConfigByUserId(user_id);
            if (!doc) throw new Error("Doctor profile not found");
            doctorId = doc.id;
        }

        const [today, week, month, total, patients, contacts] = await Promise.all([
            statsRepository.countAppointments({ doctorId, from: todayStart, to: todayEnd }),
            statsRepository.countAppointments({ doctorId, from: weekStart, to: weekEnd }),
            statsRepository.countAppointments({ doctorId, from: monthStart, to: monthEnd }),
            statsRepository.countAppointments({ doctorId }),
            statsRepository.countPatients(doctorId),
            statsRepository.countPatients(),
        ]);

        return {
            appointments_today: today,
            appointments_week: week,
            appointments_month: month,
            total_appointments: total,
            total_patients: patients,
            total_contacts: contacts,
        };
    }
}

module.exports = new UserStatsService();
