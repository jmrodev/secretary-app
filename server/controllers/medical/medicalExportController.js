const medicalExportService = require('../../services/medical/MedicalExportService');

/**
 * medicalExportController
 * Handles legacy export logic for prescriptions, licenses, and certificates.
 */

exports.exportPrescriptionsJSON = async (req, res) => {
    try {
        const result = await medicalExportService.exportPrescriptionsJSON(req.user, req.query);
        const { preview } = req.query;

        if (preview === 'true') {
            return res.json(result);
        }

        res.setHeader('Content-disposition', 'attachment; filename=prescriptions_backup.json');
        res.setHeader('Content-type', 'application/json');
        res.write(JSON.stringify(result, null, 2));
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.exportLicensesJSON = async (req, res) => {
    try {
        const result = await medicalExportService.exportLicensesJSON(req.user, req.query);
        res.json(result);
    } catch (err) {
        console.error("Error exporting licenses:", err);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.exportCertificatesJSON = async (req, res) => {
    try {
        const result = await medicalExportService.exportCertificatesJSON(req.user, req.query);
        res.json(result);
    } catch (err) {
        console.error("Error exporting certificates:", err);
        res.status(500).json({ error: "Server Error" });
    }
};
