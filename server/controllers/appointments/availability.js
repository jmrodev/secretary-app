const availabilityService = require('../../services/appointments/availabilityService');

exports.getNextFreeSlot = async (req, res) => {
    try {
        const result = await availabilityService.getNextFreeSlot(req.query);
        if (result.slot || result.breakSlot) {
            res.json(result);
        } else {
            res.status(404).json({ message: "No se encontraron turnos libres adicionales." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getFreeSlotsBatch = async (req, res) => {
    try {
        const { doctor_id, start_date, include_out_of_hours } = req.query;
        const result = await availabilityService.getFreeSlotsBatch(doctor_id, start_date, include_out_of_hours === 'true');
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getCalendarStats = async (req, res) => {
    try {
        const { year, month, doctor_id } = req.query;
        const stats = await availabilityService.getCalendarStats(year, month, doctor_id);
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};
