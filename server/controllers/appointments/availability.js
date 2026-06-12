const availabilityService = require('../../services/appointments/availabilityService');

/**
 * ECC-Pattern: Standard API Response Envelope
 */
const sendResponse = (res, success, data, error = null, status = 200) => {
    res.status(status).json({ success, data, error });
};

exports.getNextFreeSlot = async (req, res) => {
    try {
        const result = await availabilityService.getNextFreeSlot(req.query);
        if (result.slot || result.breakSlot) {
            sendResponse(res, true, result);
        } else {
            sendResponse(res, false, null, "No se encontraron turnos libres adicionales.", 404);
        }
    } catch (err) {
        console.error("[ECC-Controller] getNextFreeSlot error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};

exports.getFreeSlotsBatch = async (req, res) => {
    try {
        const { doctor_id, start_date, include_out_of_hours } = req.query;
        const result = await availabilityService.getFreeSlotsBatch(doctor_id, start_date, include_out_of_hours === 'true');
        sendResponse(res, true, result);
    } catch (err) {
        console.error("[ECC-Controller] getFreeSlotsBatch error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};

exports.getCalendarStats = async (req, res) => {
    try {
        const { year, month, doctor_id } = req.query;
        const stats = await availabilityService.getCalendarStats(year, month, doctor_id);
        sendResponse(res, true, stats);
    } catch (err) {
        console.error("[ECC-Controller] getCalendarStats error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};
