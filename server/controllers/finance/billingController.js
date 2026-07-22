const billingService = require('../../services/finance/billingService');
const fs = require('fs');
const path = require('path');

/**
 * ECC-Pattern: BillingController
 * Standards-compliant electronic invoicing management.
 */
const sendResponse = (res, success, data, error = null, status = 200) => {
    res.status(status).json({ success, data, error });
};

exports.getServerStatus = async (req, res) => {
    try {
        const { doctor_id } = req.query;
        const afip = (doctor_id && doctor_id !== 'undefined')
            ? await billingService.getAfipInstance(null, doctor_id)
            : billingService.getMockAfip();

        const [afipStatus, environment] = await Promise.all([
            afip.getServerStatus(),
            billingService.getAfipEnvironment(),
        ]);

        sendResponse(res, true, { afip_status: afipStatus, environment });
    } catch (err) {
        console.error("[ECC-Billing] getServerStatus error:", err);
        sendResponse(res, false, null, err.message, 500);
    }
};

exports.generateCsr = async (req, res) => {
    try {
        const { doctor_id, alias_suffix } = req.body;
        if (!doctor_id) return sendResponse(res, false, null, "Doctor ID required", 400);
        const result = await billingService.generateCsr(doctor_id, alias_suffix);
        sendResponse(res, true, result);
    } catch (err) {
        console.error("[ECC-Billing] generateCsr error:", err);
        sendResponse(res, false, null, err.message, 500);
    }
};

exports.uploadCert = async (req, res) => {
    try {
        if (!req.file) return sendResponse(res, false, null, "No file uploaded", 400);
        const { doctor_id } = req.body;
        if (!doctor_id) return sendResponse(res, false, null, "Doctor ID required", 400);

        const relativePath = await billingService.uploadCert(doctor_id, req.file);
        sendResponse(res, true, { message: "Certificate uploaded successfully", path: relativePath });
    } catch (err) {
        console.error("[ECC-Billing] uploadCert error:", err);
        if (req.file?.path) {
            const tempUploadDir = path.resolve(__dirname, '../../uploads/temp');
            const uploadedPath = path.resolve(req.file.path);
            if (uploadedPath.startsWith(tempUploadDir) && fs.existsSync(uploadedPath)) {
                fs.unlinkSync(uploadedPath);
            }
        }
        sendResponse(res, false, null, err.message, 500);
    }
};

exports.createInvoice = async (req, res) => {
    try {
        const { transactionId, cbteTipo } = req.body;
        if (!transactionId) return sendResponse(res, false, null, "transactionId is required", 400);
        
        const result = await billingService.createInvoice(transactionId, cbteTipo);
        sendResponse(res, true, result);
    } catch (err) {
        console.error("[ECC-Billing] createInvoice error:", err);
        sendResponse(res, false, null, err.message, 500);
    }
};
