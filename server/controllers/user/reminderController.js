const reminderService = require('../../../services/communication/reminderService');

exports.getReminders = async (req, res) => {
    try {
        const rows = await reminderService.getRemindersForUser(req.user);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.completeReminder = async (req, res) => {
    try {
        await reminderService.completeReminder(req.body);
        res.json({ message: req.body.notified !== undefined ? "Reminder notified status updated" : "Reminder marked as completed" });
    } catch (err) {
        console.error("Complete Reminder Error:", err);
        res.status(500).send("Server Error");
    }
};
