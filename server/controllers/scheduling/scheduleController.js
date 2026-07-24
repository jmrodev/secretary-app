const scheduleService = require('../../services/appointments/scheduleService');

exports.getSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const rows = await scheduleService.getSchedule(doctorId);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { schedule } = req.body;
        await scheduleService.updateSchedule(req.user, doctorId, schedule);
        res.json({ message: "Schedule updated successfully" });
    } catch (err) {
        if (err.message.includes("Unauthorized")) return res.status(403).send(err.message);
        console.error(err);
        res.status(500).send("Server Error");
    }
};
