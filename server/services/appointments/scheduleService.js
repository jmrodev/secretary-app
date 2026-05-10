const scheduleRepository = require('../../repositories/appointments/scheduleRepository');
const doctorRepository = require('../../repositories/user/doctorRepository');
const { pool } = require('../../db');
const { ROLES } = require('../../constants/roles');

/**
 * ScheduleService
 * Business logic for doctor schedules.
 */
class ScheduleService {
    async getSchedule(doctorId) {
        return await scheduleRepository.findByDoctor(doctorId);
    }

    async updateSchedule(user, doctorId, schedule) {
        const conn = await pool.getConnection();
        try {
            await this._checkPermissions(user, doctorId, conn);

            await conn.beginTransaction();
            await scheduleRepository.deleteByDoctor(doctorId, conn);

            if (schedule && schedule.length > 0) {
                for (const item of schedule) {
                    await scheduleRepository.create({
                        doctor_id: doctorId,
                        ...item
                    }, conn);
                }
            }
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async _checkPermissions(user, doctorId, conn) {
        const { role, user_id } = user;
        if (role === ROLES.DOCTOR) {
            const doc = await doctorRepository.getDoctorConfigByUserId(user_id, conn);
            if (!doc || doc.id != doctorId) {
                throw new Error("Unauthorized: Cannot edit another doctor's schedule");
            }
        } else if (role !== ROLES.ADMIN && role !== ROLES.SECRETARY) {
            throw new Error("Unauthorized");
        }
    }
}

module.exports = new ScheduleService();
