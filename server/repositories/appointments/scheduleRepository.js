

/**
 * ScheduleRepository
 * Handles table interactions for doctor availability hours.
 */
class ScheduleRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findByDoctor(doctorId, conn = this.pool) {
        return await conn.query("SELECT * FROM doctor_schedules WHERE doctor_id = ? ORDER BY day_of_week, start_time", [doctorId]);
    }

    async deleteByDoctor(doctorId, conn = this.pool) {
        return await conn.query("DELETE FROM doctor_schedules WHERE doctor_id = ?", [doctorId]);
    }

    async create(data, conn = this.pool) {
        return await conn.query(
            "INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_break, default_type, force_hour_alignment) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [data.doctor_id, data.day_of_week, data.start_time, data.end_time, data.is_break || 0, data.default_type || 'consultation', data.force_hour_alignment ? 1 : 0]
        );
    }
}

module.exports = (pool) => new ScheduleRepository(pool);
