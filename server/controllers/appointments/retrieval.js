const retrievalService = require('../../services/appointments/retrievalService');

exports.getAppointments = async (req, res) => {
    try {
        const rawSearch = req.query.search?.trim();
        const patientId = req.body?.patientId || req.query.patientId;

        // Guard: require at least a patientId OR a meaningful search term (2+ chars)
        // to avoid accidentally dumping all appointments in the response.
        if (!patientId && (!rawSearch || rawSearch.length < 2)) {
            return res.json([]);
        }

        const query = { ...(req.body || {}), search: rawSearch };
        const appointments = await retrievalService.getAppointments(req.user, query);
        res.json(appointments);
    } catch (err) {
        console.error("[Controller] getAppointments error:", err);
        res.status(500).send("Server Error");
    }
};

exports.getMonthlyReport = async (req, res) => {
    try {
        const { doctor_id, doctorId, month, year } = { ...req.query, ...req.body };
        const activeDoctorId = doctor_id || doctorId;
        const report = await retrievalService.getMonthlyReport(activeDoctorId, month, year);
        res.json(report);
    } catch (err) {
        console.error("[Controller] getMonthlyReport error:", err);
        res.status(500).send("Server Error");
    }
};

exports.getDailySchedule = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) {
            return res.status(400).json({ error: 'Faltan parámetros: doctorId y date son obligatorios.' });
        }
        const schedule = await retrievalService.getDailySchedule(doctorId, date);
        res.json(schedule);
    } catch (err) {
        console.error("[Controller] getDailySchedule error:", err);
        res.status(500).send("Server Error");
    }
};
