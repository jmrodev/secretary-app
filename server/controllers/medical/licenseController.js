const licenseService = require('../../services/medical/LicenseService');

const sendResponse = (res, success, data, meta = null, error = null, status = 200) => {
    res.status(status).json({ success, data, meta, error });
};

exports.createLicense = async (req, res) => {
    try {
        await licenseService.createLicense(req, req.body);
        sendResponse(res, true, { message: "License created" }, null, null, 201);
    } catch (err) {
        console.error("[ECC-Medical] createLicense error:", err);
        if (err.message === 'Appointment not found') return sendResponse(res, false, null, null, 'appointment_not_found', 404);
        if (err.message === 'Unauthorized') return sendResponse(res, false, null, null, 'unauthorized', 403);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.getLicenses = async (req, res) => {
    try {
        const { page = 1, limit = 50, doctorId: queryDoctorId } = req.query;
        const patientId = req.body?.patientId;
        const filters = {
            patientId,
            doctorId: req.doctorId || queryDoctorId,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        const result = await licenseService.getLicenses(req.user, filters);
        sendResponse(res, true, result.licenses || result, {
            totalCount: result.totalCount || result.length,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error("[ECC-Medical] getLicenses error:", err);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.updateLicense = async (req, res) => {
    try {
        const { id } = req.params;
        await licenseService.updateLicense(req, id, req.body);
        sendResponse(res, true, { message: "License updated" });
    } catch (err) {
        console.error("[ECC-Medical] updateLicense error:", err);
        if (err.message === 'License not found') return sendResponse(res, false, null, null, 'license_not_found', 404);
        if (err.message === 'Unauthorized') return sendResponse(res, false, null, null, 'unauthorized', 403);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};

exports.deleteLicense = async (req, res) => {
    try {
        const { id } = req.params;
        await licenseService.deleteLicense(req, id);
        sendResponse(res, true, { message: "License deleted" });
    } catch (err) {
        console.error("[ECC-Medical] deleteLicense error:", err);
        if (err.message === 'License not found') return sendResponse(res, false, null, null, 'license_not_found', 404);
        if (err.message === 'Unauthorized') return sendResponse(res, false, null, null, 'unauthorized', 403);
        sendResponse(res, false, null, null, 'server_error', 500);
    }
};
