const licenseService = require('../../services/medical/LicenseService');

/**
 * licenseController
 * Handles HTTP requests for Medical Licenses linked to appointments.
 */

exports.createLicense = async (req, res) => {
    try {
        await licenseService.createLicense(req, req.body);
        res.status(201).send("License created");
    } catch (err) {
        console.error(err);
        if (err.message === 'Appointment not found') return res.status(404).send(err.message);
        if (err.message === 'Unauthorized') return res.status(403).send(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getLicenses = async (req, res) => {
    try {
        const { page = 1, limit = 50, patientId } = req.query;
        const filters = {
            patientId,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        const result = await licenseService.getLicenses(req.user, filters);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateLicense = async (req, res) => {
    try {
        const { id } = req.params;
        await licenseService.updateLicense(req, id, req.body);
        res.send("License updated");
    } catch (err) {
        console.error(err);
        if (err.message === 'License not found') return res.status(404).send(err.message);
        if (err.message === 'Unauthorized') return res.status(403).send(err.message);
        res.status(500).send("Server Error");
    }
};

exports.deleteLicense = async (req, res) => {
    try {
        const { id } = req.params;
        await licenseService.deleteLicense(req, id);
        res.json({ message: "License deleted" });
    } catch (err) {
        console.error(err);
        if (err.message === 'License not found') return res.status(404).send(err.message);
        if (err.message === 'Unauthorized') return res.status(403).send(err.message);
        res.status(500).send("Server Error");
    }
};
