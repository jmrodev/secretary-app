const modificationService = require('../../services/appointments/modificationService');
const { logAction } = require('../../utils/system/audit');

const handleError = (res, err, context) => {
    console.error(`[ModificationController] Error in ${context}:`, err);
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json({
        error: err.message || "Server Error",
        type: err.type || 'GENERIC_ERROR'
    });
};

exports.deleteAppointment = async (req, res) => {
    try {
        await modificationService.deleteAppointment(req.params.id, req.user.user_id, req.user.role, req.body.adminPassword);
        logAction(req, 'DELETE_APPOINTMENT', `Deleted appointment ID ${req.params.id}`);
        res.json({ message: "Appointment deleted" });
    } catch (err) {
        handleError(res, err, 'deleteAppointment');
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const { adminPassword, ...updates } = req.body;
        await modificationService.updateAppointment(req.params.id, updates, req.user.user_id, req.user.role, adminPassword);
        logAction(req, 'UPDATE_APPOINTMENT', `Updated appointment ID ${req.params.id}`);
        res.json({ message: "Appointment updated" });
    } catch (err) {
        handleError(res, err, 'updateAppointment');
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;
        await modificationService.updateStatus(req.params.id, status, reason, req.user.user_id);
        logAction(req, 'UPDATE_STATUS', `Status updated for ID ${req.params.id} to ${status}`);
        res.json({ message: "Status updated" });
    } catch (err) {
        handleError(res, err, 'updateStatus');
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        await modificationService.updatePaymentStatus(req.params.id, req.body.status, req.user.user_id);
        res.json({ message: "Payment status updated" });
    } catch (err) {
        handleError(res, err, 'updatePaymentStatus');
    }
};

exports.updateType = async (req, res) => {
    try {
        await modificationService.updateType(req.params.id, req.body.type, req.user.user_id);
        res.json({ message: "Type updated" });
    } catch (err) {
        handleError(res, err, 'updateType');
    }
};

exports.bulkUpdateType = async (req, res) => {
    try {
        const { dayOfWeek, type, doctorId, fromDate, toDate } = req.body;
        const affectedRows = await modificationService.bulkUpdateType(dayOfWeek, type, doctorId, fromDate, toDate, req.user.user_id, req.user.role);
        res.json({ message: "Bulk update successful", affectedRows: Number(affectedRows) });
    } catch (err) {
        handleError(res, err, 'bulkUpdateType');
    }
};
