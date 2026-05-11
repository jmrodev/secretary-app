const userStatsService = require('../../services/system/userStatsService');

/**
 * UserStatsController
 * Handles general system statistics.
 */

exports.getStats = async (req, res) => {
    try {
        const { doctor_id } = req.query;
        const stats = await userStatsService.getStats(req.user, doctor_id);
        res.json(stats);
    } catch (err) {
        if (err.message === "Doctor profile not found") return res.status(404).send(err.message);
        console.error("getStats Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};
