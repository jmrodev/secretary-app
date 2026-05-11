const publicMedicalService = require('../../services/medical/PublicMedicalService');

/**
 * publicMedicalController
 * Handles public-facing prescription request features.
 */

exports.generatePrescriptionRequestToken = async (req, res) => {
    try {
        const { patientId, doctorId } = req.body;
        if (!patientId) return res.status(400).json({ error: "Patient ID is required" });

        const result = await publicMedicalService.generatePrescriptionRequestToken(patientId, doctorId);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.getPublicPrescriptionRequestData = async (req, res) => {
    try {
        const { token } = req.params;
        const result = await publicMedicalService.getPublicPrescriptionRequestData(token);
        res.json(result);
    } catch (err) {
        console.error(err);
        if (err.message === 'Link inválido o expirado') return res.status(404).json({ error: err.message });
        res.status(500).json({ error: "Server Error" });
    }
};

exports.submitPublicPrescriptionRequest = async (req, res) => {
    try {
        const { token } = req.params;
        const result = await publicMedicalService.submitPublicPrescriptionRequest(token, req.body, req);
        res.json(result);
    } catch (err) {
        console.error(err);
        if (err.message === 'Debe seleccionar al menos una medicación') return res.status(400).json({ error: err.message });
        if (err.message === 'Link inválido o expirado') return res.status(404).json({ error: err.message });
        if (err.message === 'No se pudo asignar un médico a la solicitud') return res.status(400).json({ error: err.message });
        res.status(500).json({ error: "Server Error" });
    }
};
