const importService = require('../services/importService');

/**
 * importCsv
 * Delegating CSV import logic to ImportService.
 */
exports.importCsv = async (req, res) => {
    try {
        await importService.importCsv(req, res);
    } catch (err) {
        console.error("CSV Import Error:", err);
        res.status(500).json({ error: err.message });
    }
};
