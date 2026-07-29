const reminderService = require('../../services/communication/reminderService');

/**
 * ECC-Pattern: Standard API Response Envelope
 */
const sendResponse = (res, success, data, error = null, status = 200) => {
    res.status(status).json({ success, data, error });
};

exports.getReminders = async (req, res) => {
    try {
        const rows = await reminderService.getRemindersForUser(req.user);
        sendResponse(res, true, rows);
    } catch (err) {
        console.error("[ECC-Controller] getReminders error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};

exports.completeReminder = async (req, res) => {
    try {
        await reminderService.completeReminder(req.body);
        const message = req.body.notified !== undefined 
            ? "Reminder notified status updated" 
            : "Reminder marked as completed";
        sendResponse(res, true, { message });
    } catch (err) {
        console.error("[ECC-Controller] completeReminder error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};
