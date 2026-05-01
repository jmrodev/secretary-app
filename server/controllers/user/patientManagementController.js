const patientService = require('../../services/patientService');
const { logCRUD } = require('../../utils/audit');

/**
 * PatientManagementController
 * Handles administration of patients.
 */

exports.getAllPatients = async (req, res) => {
    try {
        if (req.user.role === 'patient') return res.status(403).send("Unauthorized");
        const { page = 1, limit = 50, search = '', doctor_id } = req.query;
        const result = await patientService.getAllPatients(req.user, search, parseInt(page), parseInt(limit), doctor_id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.getPatientDetails = async (req, res) => {
    try {
        const details = await patientService.getPatientDetails(req.params.id);
        res.json(details);
    } catch (err) {
        console.error(err);
        res.status(err.message === "Patient not found" ? 404 : 500).send(err.message);
    }
};

exports.updatePatientDetails = async (req, res) => {
    try {
        const { oldData, newData } = await patientService.updatePatientDetails(req.params.id, req.body, req.user);
        logCRUD(req, 'UPDATE_PATIENT_DETAILS', 'patient', req.params.id, oldData, newData);
        res.send("Patient updated successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.toggleNewPatientStatus = async (req, res) => {
    try {
        const newStatus = await patientService.toggleNewPatientStatus(req.params.id);
        res.json({ success: true, is_new_patient: newStatus });
    } catch (err) {
        console.error(err);
        res.status(err.message === "Patient not found" ? 404 : 500).send(err.message);
    }
};

exports.getNewPatientStats = async (req, res) => {
    try {
        const stats = await patientService.getNewPatientStats();
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};
