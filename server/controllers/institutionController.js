const institutionService = require('../services/institutionService');

/**
 * institutionController
 * Handles HTTP requests for institution management.
 */

exports.getAllInstitutions = async (req, res) => {
    try {
        const rows = await institutionService.getAllInstitutions();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.createInstitution = async (req, res) => {
    try {
        const result = await institutionService.createInstitution(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateInstitution = async (req, res) => {
    try {
        await institutionService.updateInstitution(req.params.id, req.body);
        res.json({ message: "Institution updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getFinances = async (req, res) => {
    try {
        const result = await institutionService.getInstitutionFinances(req.params.id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getPatientList = async (req, res) => {
    try {
        const rows = await institutionService.getInstitutionPatients(req.params.id);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.deleteInstitution = async (req, res) => {
    try {
        await institutionService.deleteInstitution(req.params.id);
        res.json({ message: "Institution deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};
