const googleSpreadsheetService = require('../../services/google/GoogleSpreadsheetService');
const { logAction } = require('../../utils/system/audit');

/**
 * googleSpreadsheetController
 * Handles HTTP requests for Google Sheets financial synchronization.
 */

exports.resetSpreadsheet = async (req, res) => {
    try {
        const { doctorId } = req.body;
        if (!doctorId) return res.status(400).json({ error: "Doctor ID required" });

        await googleSpreadsheetService.resetSpreadsheetId(doctorId);
        await logAction(req, 'SPREADSHEET_RESET', `Reset spreadsheet ID for Doctor ${doctorId}`);

        res.json({ message: "Spreadsheet ID reset. A new one will be created on next sync." });
    } catch (err) {
        console.error("Reset Spreadsheet Error:", err);
        res.status(500).json({ error: err.message });
    }
};
