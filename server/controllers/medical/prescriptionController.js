const prescriptionService = require('../../services/medical/PrescriptionService');

/**
 * prescriptionController
 * Handles HTTP requests for medical prescriptions.
 */

exports.createPrescription = async (req, res) => {
    try {
        await prescriptionService.createPrescription(req, req.body);
        res.status(201).send("Prescription created");
    } catch (err) {
        console.error(err);
        if (err.message === 'Appointment not found') return res.status(404).send(err.message);
        if (err.message === 'Unauthorized') return res.status(403).send(err.message);
        if (err.message === 'Medications are required') return res.status(400).send(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getPrescriptions = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const patientId = req.body?.patientId || req.query.patientId;
        const filters = {
            patientId,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        const result = await prescriptionService.getPrescriptions(req.user, filters);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updatePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        await prescriptionService.updatePrescription(req, id, req.body);
        res.send("Prescription updated");
    } catch (err) {
        console.error(err);
        if (err.message === 'Prescription not found') return res.status(404).send(err.message);
        if (err.message === 'Unauthorized') return res.status(403).send(err.message);
        res.status(500).send("Server Error");
    }
};

exports.deletePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        await prescriptionService.deletePrescription(req, id);
        res.json({ message: "Prescription deleted" });
    } catch (err) {
        console.error(err);
        if (err.message === 'Prescription not found') return res.status(404).send(err.message);
        if (err.message === 'Unauthorized') return res.status(403).send(err.message);
        res.status(500).send("Server Error");
    }
};
