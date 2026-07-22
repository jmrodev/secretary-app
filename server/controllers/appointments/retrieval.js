const retrievalService = require('../../services/appointments/retrievalService');

/**
 * ECC-Pattern: Standard API Response Envelope
 */
const sendResponse = (res, success, data, error = null, status = 200) => {
    res.status(status).json({ success, data, error });
};

exports.getAppointments = async (req, res) => {
    try {
        const rawSearch = req.query.search?.trim();
        const patientId = req.params.patientId || req.body?.patientId;

        if (!patientId && (!rawSearch || rawSearch.length < 2)) {
            return sendResponse(res, true, []);
        }

        const query = { ...(req.body || {}), search: rawSearch };
        const appointments = await retrievalService.getAppointments(req.user, query);
        sendResponse(res, true, appointments);
    } catch (err) {
        console.error("[ECC-Controller] getAppointments error:", err);
        sendResponse(res, false, null, "Internal Server Error", 500);
    }
};

exports.getMonthlyReport = async (req, res) => {
    try {
        const { doctor_id, doctorId, month, year } = { ...req.query, ...req.body };
        const activeDoctorId = doctor_id || doctorId;
        
        if (!activeDoctorId) {
            return sendResponse(res, false, null, "doctorId is required", 400);
        }

        const report = await retrievalService.getMonthlyReport(activeDoctorId, month, year);
        sendResponse(res, true, report);
    } catch (err) {
        console.error("[ECC-Controller] getMonthlyReport error:", err);
        sendResponse(res, false, null, "Internal Server Error", 500);
    }
};

exports.getDailySchedule = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        
        // ECC: Strict Validation
        if (!doctorId) {
            return sendResponse(res, false, null, "Falta el parámetro obligatorio: doctorId", 400);
        }
        if (!date || isNaN(Date.parse(date))) {
            return sendResponse(res, false, null, "Falta o es inválido el parámetro: date (formato YYYY-MM-DD)", 400);
        }

        const schedule = await retrievalService.getDailySchedule(doctorId, date);
        sendResponse(res, true, schedule);
    } catch (err) {
        console.error("[ECC-Controller] getDailySchedule error:", err);
        sendResponse(res, false, null, "Error al recuperar la agenda diaria", 500);
    }
};
