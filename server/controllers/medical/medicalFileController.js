const medicalFileService = require('../../services/medical/MedicalFileService');

/**
 * medicalFileController
 * Handles HTTP requests for patient file management.
 */

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file uploaded");
        await medicalFileService.uploadFile(req, req);
        res.status(201).json({ message: "File uploaded" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getPatientFiles = async (req, res) => {
    try {
        const filters = {
            patient_id: req.body?.patient_id || req.query?.patient_id,
            doctorId: req.doctorId || req.query?.doctorId
        };
        const rows = await medicalFileService.getPatientFiles(filters);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        await medicalFileService.deleteFile(req, id);
        res.json({ message: "File deleted" });
    } catch (err) {
        console.error(err);
        if (err.message === 'File not found') return res.status(404).json({ message: err.message });
        if (err.message === 'Unauthorized') return res.status(403).send(err.message);
        res.status(500).send("Server Error");
    }
};
