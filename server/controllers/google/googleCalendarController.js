const googleCalendarService = require('../../services/google/GoogleCalendarService');
const googleCalendarAuditService = require('../../services/google/GoogleCalendarAuditService');
const { logAction } = require('../../utils/system/audit');

/**
 * googleCalendarController
 * Handles HTTP requests for calendar synchronization and event management.
 */

exports.listAppointments = async (req, res) => {
    try {
        const result = await googleCalendarService.listEvents(req.query.doctorId, req.query);
        res.json(result);
    } catch (err) {
        console.error("Calendar List Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.createAppointment = async (req, res) => {
    const { summary, description, startTime, endTime, doctorId } = req.body;
    try {
        const eventData = {
            summary, description,
            start: { dateTime: startTime },
            end: { dateTime: endTime }
        };

        const result = await googleCalendarService.createEventHelper(doctorId, eventData, req.user.user_id, req);
        if (!result) return res.status(400).json({ error: "Failed to create event or Google account not connected" });

        res.json({ message: "Event created", eventId: result.id, link: result.htmlLink });
    } catch (err) {
        console.error("Calendar Create Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { doctorId } = req.body;
        if (!doctorId) return res.status(400).json({ error: "Doctor ID required" });

        const success = await googleCalendarService.deleteEventHelper(doctorId, eventId, req.user.user_id, req);
        if (success) res.json({ message: "Google Event deleted" });
        else res.status(500).json({ error: "Failed to delete Google Event" });
    } catch (err) {
        console.error("Delete Event Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.syncDayToGoogle = async (req, res) => {
    try {
        const { doctorId, date } = req.body;
        if (!doctorId || !date) return res.status(400).json({ error: "Doctor ID and date required" });
        const results = await googleCalendarService.syncDayToGoogle(req, doctorId, date);
        res.json({ message: "Day sync completed", ...results });
    } catch (err) {
        console.error("Sync Day Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAuditAppointments = async (req, res) => {
    try {
        const data = await googleCalendarAuditService.getAuditData(req.query);
        res.json(data);
    } catch (err) {
        console.error("Get Audit Data Error:", err);
        res.status(500).send("Server Error");
    }
};

exports.sanitizeAppointment = async (req, res) => {
    try {
        const result = await googleCalendarAuditService.sanitizeAppointment(req.params.id, req.body, req.user.user_id, req);
        logAction(req, 'SANITIZE_APPOINTMENT', `Sanitized Appt ${req.params.id}`);
        res.json(result);
    } catch (err) {
        console.error("Sanitization Error:", err);
        res.status(500).send("Server Error");
    }
};

exports.retryFailedItems = async (req, res) => {
    try {
        await googleCalendarService.retryFailedSyncItems();
        await logAction(req, 'GOOGLE_SYNC_RETRY', 'Reset retries for stalled sync items');
        res.json({ message: "Retry initiated for stalled items." });
    } catch (err) {
        console.error("Retry Failed Items Error:", err);
        res.status(500).json({ error: err.message });
    }
};
