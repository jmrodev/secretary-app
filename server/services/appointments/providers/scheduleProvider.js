const appointmentRepository = require('../../../repositories/appointmentRepository');
const { pool } = require('../../../db');

class ScheduleProvider {
    async getDoctorSchedule(doctorId, dayOfWeek, conn) {
        return await conn.query(
            "SELECT * FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ?",
            [doctorId, dayOfWeek]
        );
    }

    async getDoctorConfig(doctorId, conn) {
        const rows = await conn.query(
            "SELECT appointment_duration, overturn_start_time, overturn_end_time, force_hour_alignment FROM doctors WHERE id = ?",
            [doctorId]
        );
        return rows[0] || { appointment_duration: 60 };
    }
}

module.exports = new ScheduleProvider();
