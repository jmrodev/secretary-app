const retrievalService = require('../../services/appointments/retrievalService');

exports.getAppointments = async (req, res) => {
    try {
        const query = { ...(req.body || {}), search: req.query.search };
        const appointments = await retrievalService.getAppointments(req.user, query);
        res.json(appointments);
    } catch (err) {
        console.error("[Controller] getAppointments error:", err);
        res.status(500).send("Server Error");
    }
};

exports.getMonthlyReport = async (req, res) => {
    try {
        const { doctor_id, month, year } = { ...req.query, ...req.body };
        const report = await retrievalService.getMonthlyReport(doctor_id, month, year);
        res.json(report);
    } catch (err) {
        console.error("[Controller] getMonthlyReport error:", err);
        res.status(500).send("Server Error");
    }
};
