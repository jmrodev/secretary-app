const doctorRepository = require('../../../../repositories/user/doctorRepository');

class ScheduleProvider {
    async getDoctorSchedule(doctorId, dayOfWeek, conn) {
        return await doctorRepository.getDoctorScheduleForDay(doctorId, dayOfWeek, conn);
    }

    async getDoctorConfig(doctorId, conn) {
        const config = await doctorRepository.getDoctorConfig(doctorId, conn);
        return config || { appointment_duration: 60 };
    }
}

module.exports = new ScheduleProvider();
