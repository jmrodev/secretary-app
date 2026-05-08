const medicalRequestService = require('../../services/medical/MedicalRequestService');

/**
 * medicalRequestController
 * Handles HTTP requests for Medical Requests (Certificates, Requests).
 */

exports.createRequest = async (req, res) => {
    try {
        const requestId = await medicalRequestService.createRequest(req, req.body);
        res.status(201).json({ id: requestId, message: "request_created" });
    } catch (err) {
        console.error(err);
        if (err.message === 'Invalid type') return res.status(400).json({ error: 'invalid_type' });
        if (err.message === 'Patient not found') return res.status(404).json({ error: 'patient_not_found' });
        res.status(500).json({ error: 'server_error' });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, patientId, doctorId: queryDoctorId, search } = req.query;
        const filters = {
            patientId,
            doctorId: req.doctorId || queryDoctorId,
            status,
            search: search?.trim() || undefined,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };

        const result = await medicalRequestService.getRequests(req.user, filters);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        await medicalRequestService.updateRequestStatus(req, id, req.body);
        res.json({ message: "request_updated" });
    } catch (err) {
        console.error(err);
        if (err.message === 'Note is required for this status') return res.status(400).json({ error: 'note_required' });
        if (err.message === 'Request not found') return res.status(404).json({ error: 'request_not_found' });
        if (err.message.includes('administrators')) return res.status(403).json({ error: 'secretary_restricted' });
        res.status(500).json({ error: 'server_error' });
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await medicalRequestService.updateRequest(req, id, req.body);
        res.json({ message: "request_updated" });
    } catch (err) {
        console.error(err);
        if (err.message === 'Request not found') return res.status(404).json({ error: 'request_not_found' });
        if (err.message === 'Unauthorized') return res.status(403).json({ error: 'unauthorized' });
        if (err.message.includes('administrators')) return res.status(403).json({ error: 'secretary_restricted' });
        res.status(500).json({ error: 'server_error' });
    }
};

exports.updateRequestPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await medicalRequestService.updateRequestPaymentStatus(id, status);
        res.json({ message: "payment_status_updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await medicalRequestService.deleteRequest(req, id);
        res.json({ message: "request_deleted" });
    } catch (err) {
        console.error(err);
        if (err.message === 'Request not found') return res.status(404).json({ error: 'request_not_found' });
        if (err.message === 'Unauthorized' || err.message.includes('Only admins')) return res.status(403).json({ error: 'unauthorized' });
        res.status(500).json({ error: 'server_error' });
    }
};

