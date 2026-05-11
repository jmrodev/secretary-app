const doctorService = require('../../../services/user/doctorService');

/**
 * DoctorManagementController
 * Handles administration of doctors.
 */

exports.getAllDoctors = async (req, res) => {
    try {
        const rows = await doctorService.getAllDoctors();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        await doctorService.updateDoctor(id, req.body);
        res.json({ message: "Doctor updated successfully" });
    } catch (err) {
        console.error("Update Doctor Error:", err);
        res.status(500).send("Server Error");
    }
};
