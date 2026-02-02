const googleController = require('../../../controllers/googleController');
const { pool } = require('../../../db');

class BusyProvider {
    async getBusyIntervals(doctorId, startTime, endTime) {
        // Combined Google + DB busy times
        let googleBusy = [];
        try {
            googleBusy = await googleController.getBusyIntervals(doctorId, startTime.toISOString(), endTime.toISOString());
        } catch (e) { console.warn("Google Busy fail", e.message); }

        const dbBusy = await pool.query(
            "SELECT appointment_date, duration FROM appointments WHERE doctor_id = ? AND appointment_date BETWEEN ? AND ? AND status NOT IN ('cancelled', 'rescheduled')",
            [doctorId, startTime, endTime]
        );

        return { google: googleBusy, db: dbBusy };
    }
}

module.exports = new BusyProvider();
