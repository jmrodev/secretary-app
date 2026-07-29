const userStatsService = require('../../services/system/userStatsService');

/**
 * ECC-Pattern: UserStatsController
 */
const sendResponse = (res, success, data, error = null, status = 200) => {
    res.status(status).json({ success, data, error });
};

exports.getStats = async (req, res) => {
    try {
        const { doctor_id } = req.query;
        const stats = await userStatsService.getStats(req.user, doctor_id);
        sendResponse(res, true, stats);
    } catch (err) {
        if (err.message === "Doctor profile not found") return sendResponse(res, false, null, err.message, 404);
        console.error("[ECC-Controller] getStats error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};
