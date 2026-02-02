const modificationService = require('../../services/appointments/modificationService');
const { logAction } = require('../../utils/audit');

exports.deleteAppointment = async (req, res) => {
    try {
        await modificationService.deleteAppointment(req.params.id, req.user.user_id, req.user.role, req.body.adminPassword);
        logAction(req, 'DELETE_APPOINTMENT', `Deleted appointment ID ${req.params.id}`);
        res.json({ message: "Appointment deleted" });
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message || "Server Error");
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const { adminPassword, ...updates } = req.body;
        await modificationService.updateAppointment(req.params.id, updates, req.user.user_id, req.user.role, adminPassword);
        logAction(req, 'UPDATE_APPOINTMENT', `Updated appointment ID ${req.params.id}`);
        res.json({ message: "Appointment updated" });
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message || "Server Error");
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;
        await modificationService.updateStatus(req.params.id, status, reason, req.user.user_id);
        logAction(req, 'UPDATE_STATUS', `Status updated for ID ${req.params.id} to ${status}`);
        res.json({ message: "Status updated" });
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message || "Server Error");
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        await modificationService.updatePaymentStatus(req.params.id, req.body.status, req.user.user_id);
        res.json({ message: "Payment status updated" });
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message || "Server Error");
    }
};

exports.updateType = async (req, res) => {
    try {
        await modificationService.updateType(req.params.id, req.body.type, req.user.user_id);
        res.json({ message: "Type updated" });
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message || "Server Error");
    }
};

exports.bulkUpdateType = async (req, res) => {
    // This could also be moved to a service, but for now keeping it in controller or demonstrating the pattern
    res.status(501).send("Not implemented in refactored version yet");
};
