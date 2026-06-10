const prescriptionService = require('../../services/medical/PrescriptionService');

const sendResponse = (res, success, data, meta = null, error = null, status = 200) => {
    res.status(status).json({ success, data, meta, error });
};

exports.createPrescription = async (req, res) => {
    try {
        await prescriptionService.createPrescription(req, req.body);
        sendResponse(res, true, { message: "Prescription created" }, null, null, 201);
    } catch (err) {
        console.error("[ECC-Medical] createPrescription error:", err);
        if (err.message === 'Appointment not found') return sendResponse(res, false, null, null, 'appointment_not_found', 404);
        if (err.message === 'Unauthorized') return sendResponse(res, false, null, null, 'unauthorized', 403);
        if (err.message === 'Medications are required') return sendResponse(res, false, null, null, 'medications_required', 400);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.getPrescriptions = async (req, res) => {
    try {
        const { page = 1, limit = 50, patientId, doctorId: queryDoctorId } = req.query;
        const filters = {
            patientId,
            doctorId: req.doctorId || queryDoctorId,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        const result = await prescriptionService.getPrescriptions(req.user, filters);
        sendResponse(res, true, result.prescriptions || result, {
            totalCount: result.totalCount || result.length,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error("[ECC-Medical] getPrescriptions error:", err);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.updatePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        await prescriptionService.updatePrescription(req, id, req.body);
        sendResponse(res, true, { message: "Prescription updated" });
    } catch (err) {
        console.error("[ECC-Medical] updatePrescription error:", err);
        if (err.message === 'Prescription not found') return sendResponse(res, false, null, null, 'prescription_not_found', 404);
        if (err.message === 'Unauthorized') return sendResponse(res, false, null, null, 'unauthorized', 403);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.deletePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        await prescriptionService.deletePrescription(req, id);
        sendResponse(res, true, { message: "Prescription deleted" });
    } catch (err) {
        console.error("[ECC-Medical] deletePrescription error:", err);
        if (err.message === 'Prescription not found') return sendResponse(res, false, null, null, 'prescription_not_found', 404);
        if (err.message === 'Unauthorized') return sendResponse(res, false, null, null, 'unauthorized', 403);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};
