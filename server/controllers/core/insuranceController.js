const insuranceService = require('../../services/core/insuranceService');

/**
 * insuranceController
 * Handles HTTP requests for insurance management.
 */

exports.getAllInsurances = async (req, res) => {
    try {
        const rows = await insuranceService.getAllInsurances();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getInsuranceById = async (req, res) => {
    try {
        const rows = await insuranceService.getInsuranceById(req.params.id);
        if (!rows) return res.status(404).send("Insurance not found");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.createInsurance = async (req, res) => {
    try {
        const result = await insuranceService.createInsurance(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateInsurance = async (req, res) => {
    try {
        await insuranceService.updateInsurance(req.params.id, req.body);
        res.json({ message: "Insurance updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.deleteInsurance = async (req, res) => {
    try {
        await insuranceService.deleteInsurance(req.params.id);
        res.json({ message: "Insurance deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};
