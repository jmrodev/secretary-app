const googleCalendarService = require('../../google/GoogleCalendarService');
const appointmentRepository = require('../../../repositories/appointmentRepository');

class BusyProvider {
    async getBusyIntervals(doctorId, startTime, endTime) {
        // Combined Google + DB busy times
        let googleBusy = [];
        try {
            googleBusy = await googleCalendarService.getBusyIntervals(doctorId, startTime.toISOString(), endTime.toISOString());
        } catch (e) {
            console.warn("Google Busy fail", e.message);
        }

        const dbBusy = await appointmentRepository.findInRange(doctorId, startTime.toISOString(), endTime.toISOString(), ['cancelled', 'absent', 'suspended']);

        return { google: googleBusy, db: dbBusy };
    }
}

module.exports = new BusyProvider();
