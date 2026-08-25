const medicalRequestService = require('../../services/medical/MedicalRequestService');

const sendResponse = (res, success, data, meta = null, error = null, status = 200) => {
    res.status(status).json({ success, data, meta, error });
};

exports.createRequest = async (req, res) => {
    try {
        const requestId = await medicalRequestService.createRequest(req, req.body);
        sendResponse(res, true, { id: requestId, message: "request_created" }, null, null, 201);
    } catch (err) {
        console.error("[ECC-Medical] createRequest error:", err);
        if (err.message === 'Invalid type') return sendResponse(res, false, null, null, 'invalid_type', 400);
        if (err.message === 'Patient not found') return sendResponse(res, false, null, null, 'patient_not_found', 404);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.getRequests = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, type, patientId, doctorId: queryDoctorId, search } = req.query;
        const filters = {
            patientId,
            doctorId: req.doctorId || queryDoctorId,
            type,
            status,
            search: search?.trim() || undefined,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };

        const result = await medicalRequestService.getRequests(req.user, filters);
        sendResponse(res, true, result.requests || result, {
            totalCount: result.totalCount || result.length,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error("[ECC-Medical] getRequests error:", err);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        await medicalRequestService.updateRequestStatus(req, id, req.body);
        sendResponse(res, true, { message: "request_updated" });
    } catch (err) {
        console.error("[ECC-Medical] updateRequestStatus error:", err);
        if (err.message === 'Note is required for this status') return sendResponse(res, false, null, null, 'note_required', 400);
        if (err.message === 'Request not found') return sendResponse(res, false, null, null, 'request_not_found', 404);
        if (err.message.includes('administrators')) return sendResponse(res, false, null, null, 'secretary_restricted', 403);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await medicalRequestService.updateRequest(req, id, req.body);
        sendResponse(res, true, { message: "request_updated" });
    } catch (err) {
        console.error("[ECC-Medical] updateRequest error:", err);
        if (err.message === 'Request not found') return sendResponse(res, false, null, null, 'request_not_found', 404);
        if (err.message === 'Unauthorized') return sendResponse(res, false, null, null, 'unauthorized', 403);
        if (err.message.includes('administrators')) return sendResponse(res, false, null, null, 'secretary_restricted', 403);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.updateRequestPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await medicalRequestService.updateRequestPaymentStatus(id, status);
        sendResponse(res, true, { message: "payment_status_updated" });
    } catch (err) {
        console.error("[ECC-Medical] updateRequestPaymentStatus error:", err);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await medicalRequestService.deleteRequest(req, id);
        sendResponse(res, true, { message: "request_deleted" });
    } catch (err) {
        console.error("[ECC-Medical] deleteRequest error:", err);
        if (err.message === 'Request not found') return sendResponse(res, false, null, null, 'request_not_found', 404);
        if (err.message === 'Unauthorized' || err.message.includes('Only admins')) return sendResponse(res, false, null, null, 'unauthorized', 403);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};
