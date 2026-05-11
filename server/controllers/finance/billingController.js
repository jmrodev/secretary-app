const billingService = require('../../services/finance/billingService');
const fs = require('fs');

/**
 * Billing Controller
 * Handles HTTP requests for Electronic Invoicing.
 */

exports.getServerStatus = async (req, res) => {
    try {
        const { doctor_id } = req.query;
        const afip = (doctor_id && doctor_id !== 'undefined')
            ? await billingService.getAfipInstance(null, doctor_id)
            : billingService.getMockAfip();

        const [afipStatus, environment] = await Promise.all([
            afip.getServerStatus(),
            billingService.getAfipEnvironment(),
        ]);

        res.json({ status: 'OK', afip_status: afipStatus, environment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.generateCsr = async (req, res) => {
    try {
        const { doctor_id, alias_suffix } = req.body;
        if (!doctor_id) return res.status(400).json({ error: "Doctor ID required" });
        const result = await billingService.generateCsr(doctor_id, alias_suffix);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.uploadCert = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const { doctor_id } = req.body;
        if (!doctor_id) return res.status(400).json({ error: "Doctor ID required" });

        const relativePath = await billingService.uploadCert(doctor_id, req.file);
        res.json({ message: "Certificate uploaded successfully", path: relativePath });
    } catch (err) {
        console.error(err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        const { transactionId, cbteTipo } = req.body;
        const result = await billingService.createInvoice(transactionId, cbteTipo);
        res.json({ message: "Invoice created successfully", invoice: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
