const doctorService = require('../../services/user/doctorService');

/**
 * ECC-Pattern: Standard API Response Envelope
 */
const sendResponse = (res, success, data, error = null, status = 200) => {
    res.status(status).json({ success, data, error });
};

exports.getAllDoctors = async (req, res) => {
    try {
        const rows = await doctorService.getAllDoctors();
        sendResponse(res, true, rows);
    } catch (err) {
        console.error("[ECC-Controller] getAllDoctors error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};

exports.updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        await doctorService.updateDoctor(id, req.body);
        sendResponse(res, true, { message: "Doctor updated successfully" });
    } catch (err) {
        console.error("[ECC-Controller] updateDoctor error:", err);
        sendResponse(res, false, null, "Server Error", 500);
    }
};
