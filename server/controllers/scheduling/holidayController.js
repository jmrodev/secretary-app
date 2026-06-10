const holidayService = require('../../services/appointments/holidayService');

/**
 * ECC-Pattern: Standard API Response Envelope
 */
const sendResponse = (res, success, data, error = null, status = 200) => {
    res.status(status).json({ success, data, error });
};

exports.getHolidays = async (req, res) => {
    try {
        const rows = await holidayService.getHolidays();
        sendResponse(res, true, rows);
    } catch (err) {
        console.error("[ECC-Controller] getHolidays error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};

exports.addHoliday = async (req, res) => {
    try {
        await holidayService.addHoliday(req.body);
        sendResponse(res, true, null, null, 201);
    } catch (err) {
        if (err.message === "Holiday already exists for this date") {
            return sendResponse(res, false, null, err.message, 409);
        }
        if (err.message === "Date and description required") {
            return sendResponse(res, false, null, err.message, 400);
        }
        console.error("[ECC-Controller] addHoliday error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};

exports.deleteHoliday = async (req, res) => {
    try {
        await holidayService.deleteHoliday(req.params.id);
        sendResponse(res, true, { message: "Holiday deleted" });
    } catch (err) {
        console.error("[ECC-Controller] deleteHoliday error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};
