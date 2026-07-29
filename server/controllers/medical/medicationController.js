const medicationService = require('../../services/medical/MedicationService');
const userRepository = require('../../repositories/user/userRepository');
const bcrypt = require('bcrypt');

/**
 * medicationController
 * Handles HTTP requests for Vademecum and Patient Medications.
 */

exports.searchVademecum = async (req, res) => {
    try {
        const { q } = req.query;
        const results = await medicationService.searchVademecum(q);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getPatientMedications = async (req, res) => {
    try {
        const { patientId } = req.params;
        const rows = await medicationService.getPatientMedications(patientId);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.addPatientMedication = async (req, res) => {
    try {
        const added_by = req.user.user_id;
        await medicationService.addPatientMedication(req.body, added_by);
        res.status(201).json({ message: "Medication added to patient" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updatePatientMedication = async (req, res) => {
    try {
        const { id } = req.params;
        await medicationService.updatePatientMedication(id, req.body);
        res.json({ message: "Patient medication updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.deletePatientMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const password = req.body?.password || req.body?.adminPassword;
        if (!password) return res.status(401).json({ error: "password_required" });

        const currentUser = await userRepository.findById(req.user.user_id);
        if (!currentUser || !(await bcrypt.compare(password, currentUser.password_hash))) {
            return res.status(401).json({ error: "invalid_password" });
        }

        await medicationService.deletePatientMedication(id);
        res.json({ message: "Medication discontinued" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};
