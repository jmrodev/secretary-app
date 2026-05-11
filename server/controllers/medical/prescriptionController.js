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
        if (err.message === 'Appointment not found') return res.status(404).json({ error: 'appointment_not_found' });
        if (err.message === 'Unauthorized') return res.status(403).json({ error: 'unauthorized' });
        if (err.message === 'Medications are required') return res.status(400).json({ error: 'medications_required' });
        res.status(500).json({ error: 'server_error' });
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
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server_error' });
    }
};

exports.updatePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        await prescriptionService.updatePrescription(req, id, req.body);
        res.send("Prescription updated");
    } catch (err) {
        console.error(err);
        if (err.message === 'Prescription not found') return res.status(404).json({ error: 'prescription_not_found' });
        if (err.message === 'Unauthorized') return res.status(403).json({ error: 'unauthorized' });
        res.status(500).json({ error: 'server_error' });
    }
};

exports.deletePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        await prescriptionService.deletePrescription(req, id);
        res.json({ message: "Prescription deleted" });
    } catch (err) {
        console.error(err);
        if (err.message === 'Prescription not found') return res.status(404).json({ error: 'prescription_not_found' });
        if (err.message === 'Unauthorized') return res.status(403).json({ error: 'unauthorized' });
        res.status(500).json({ error: 'server_error' });
    }
};
