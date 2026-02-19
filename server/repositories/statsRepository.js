const { pool } = require('../db');

/**
 * StatsRepository
 * Handles aggregate queries for system statistics.
 */
class StatsRepository {
    async countAppointments(filters = {}, conn = pool) {
        const { doctorId, from, to } = filters;
        let query = "SELECT COUNT(*) as count FROM appointments WHERE 1=1";
        const params = [];

        if (doctorId) { query += " AND doctor_id = ?"; params.push(doctorId); }
        if (from) { query += " AND appointment_date >= ?"; params.push(from); }
        if (to) { query += " AND appointment_date < ?"; params.push(to); }

        const [row] = await conn.query(query, params);
        return Number(row.count);
    }

    async countPatients(doctorId = null, conn = pool) {
        if (doctorId) {
            const [row] = await conn.query("SELECT COUNT(DISTINCT patient_id) as count FROM patient_doctors WHERE doctor_id = ?", [doctorId]);
            return Number(row.count);
        }
        const [row] = await conn.query("SELECT COUNT(*) as count FROM patients");
        return Number(row.count);
    }
}

module.exports = new StatsRepository();
