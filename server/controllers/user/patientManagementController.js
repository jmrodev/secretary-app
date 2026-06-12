const patientService = require('../../services/user/patientService');
const { logCRUD } = require('../../utils/system/audit');

/**
 * ECC-Pattern: Standard API Response Envelope
 */
const sendResponse = (res, success, data, meta = null, error = null, status = 200) => {
    res.status(status).json({ success, data, meta, error });
};

exports.getAllPatients = async (req, res) => {
    try {
        if (req.user.role === 'patient') return sendResponse(res, false, null, null, "Unauthorized", 403);
        
        const { page = 1, limit = 50, search = '', doctor_id } = req.query;
        
        const result = await patientService.getAllPatients(
            req.user, 
            search, 
            parseInt(page), 
            parseInt(limit), 
            doctor_id
        );

        sendResponse(res, true, result.patients, {
            totalCount: result.totalCount,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error("[ECC-Controller] getAllPatients error:", err);
        sendResponse(res, false, null, null, "Error al recuperar pacientes", 500);
    }
};

exports.getPatientDetails = async (req, res) => {
    try {
        const details = await patientService.getPatientDetails(req.params.id);
        sendResponse(res, true, details);
    } catch (err) {
        console.error("[ECC-Controller] getPatientDetails error:", err);
        const status = err.message === "Patient not found" ? 404 : 500;
        sendResponse(res, false, null, null, err.message, status);
    }
};

exports.updatePatientDetails = async (req, res) => {
    try {
        const { oldData, newData } = await patientService.updatePatientDetails(req.params.id, req.body, req.user);
        logCRUD(req, 'UPDATE_PATIENT_DETAILS', 'patient', req.params.id, oldData, newData);
        sendResponse(res, true, null, null, "Patient updated successfully");
    } catch (err) {
        console.error("[ECC-Controller] updatePatientDetails error:", err);
        sendResponse(res, false, null, null, "Internal Server Error", 500);
    }
};

exports.toggleNewPatientStatus = async (req, res) => {
    try {
        const newStatus = await patientService.toggleNewPatientStatus(req.params.id);
        sendResponse(res, true, { is_new_patient: newStatus });
    } catch (err) {
        console.error("[ECC-Controller] toggleNewPatientStatus error:", err);
        const status = err.message === "Patient not found" ? 404 : 500;
        sendResponse(res, false, null, null, err.message, status);
    }
};

exports.getNewPatientStats = async (req, res) => {
    try {
        const stats = await patientService.getNewPatientStats();
        sendResponse(res, true, stats);
    } catch (err) {
        console.error("[ECC-Controller] getNewPatientStats error:", err);
        sendResponse(res, false, null, null, "Server Error", 500);
    }
};

exports.getRecentPatients = async (req, res) => {
    try {
        const patients = await patientService.getRecentPatients();
        sendResponse(res, true, patients);
    } catch (err) {
        console.error("[ECC-Controller] getRecentPatients error:", err);
        sendResponse(res, false, null, null, "Server Error", 500);
    }
};

exports.getSearchSuggestions = async (req, res) => {
    try {
        const suggestions = await patientService.getSearchSuggestions(req.user);
        sendResponse(res, true, suggestions);
    } catch (err) {
        console.error("[ECC-Controller] getSearchSuggestions error:", err);
        sendResponse(res, false, null, null, "Server Error", 500);
    }
};
