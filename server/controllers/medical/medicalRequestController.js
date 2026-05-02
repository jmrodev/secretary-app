const medicalRequestService = require('../../services/medical/MedicalRequestService');

/**
 * medicalRequestController
 * Handles HTTP requests for Medical Requests (Certificates, Requests).
 */

exports.createRequest = async (req, res) => {
    try {
        const requestId = await medicalRequestService.createRequest(req, req.body);
        res.status(201).json({ id: requestId, message: "Request created" });
    } catch (err) {
        console.error(err);
        if (err.message === 'Invalid type') return res.status(400).send(err.message);
        if (err.message === 'Patient not found') return res.status(404).send(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getRequests = async (req, res) => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        const { patientId, doctorId } = req.body;
        const filters = {
            patientId,
            doctorId,
            status,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        const result = await medicalRequestService.getRequests(req.user, filters);
        console.log(`[GET_REQUESTS] User: ${req.user.username} (Role: ${req.user.role}). Total: ${result.totalCount}`);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        await medicalRequestService.updateRequestStatus(req, id, req.body);
        res.json({ message: "Request updated" });
    } catch (err) {
        console.error(err);
        if (err.message === 'Note is required for this status') return res.status(400).json({ message: err.message });
        if (err.message === 'Request not found') return res.status(404).json({ message: err.message });
        if (err.message.includes('administrators')) return res.status(403).json({ message: err.message });
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await medicalRequestService.updateRequest(req, id, req.body);
        res.json({ message: "Request updated" });
    } catch (err) {
        console.error(err);
        if (err.message === 'Request not found') return res.status(404).send(err.message);
        if (err.message === 'Unauthorized') return res.status(403).send(err.message);
        if (err.message.includes('administrators')) return res.status(403).json({ message: err.message });
        res.status(500).send("Server Error");
    }
};

exports.updateRequestPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await medicalRequestService.updateRequestPaymentStatus(id, status);
        res.json({ message: "Payment status updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await medicalRequestService.deleteRequest(req, id);
        res.json({ message: "Request deleted successfully" });
    } catch (err) {
        console.error(err);
        if (err.message === 'Request not found') return res.status(404).send(err.message);
        if (err.message === 'Unauthorized' || err.message.includes('Only admins')) return res.status(403).send(err.message);
        res.status(500).send("Server Error");
    }
};
