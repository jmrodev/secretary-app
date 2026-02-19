const holidayService = require('../services/holidayService');

exports.getHolidays = async (req, res) => {
    try {
        const rows = await holidayService.getHolidays();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.addHoliday = async (req, res) => {
    try {
        await holidayService.addHoliday(req.body);
        res.status(201).json({ message: "Holiday added" });
    } catch (err) {
        if (err.message === "Holiday already exists for this date") {
            return res.status(409).send(err.message);
        }
        if (err.message === "Date and description required") {
            return res.status(400).send(err.message);
        }
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.deleteHoliday = async (req, res) => {
    try {
        await holidayService.deleteHoliday(req.params.id);
        res.json({ message: "Holiday deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};
