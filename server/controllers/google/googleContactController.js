const googleContactService = require('../../services/google/GoogleContactService');
const { logAction } = require('../../utils/audit');

/**
 * googleContactController
 * Handles manual contact import from Google.
 */

exports.importContacts = async (req, res) => {
    try {
        const result = await googleContactService.importContacts(req, req.body.doctorId);
        res.json({ message: "Import completed", result });
        await logAction(req, 'GOOGLE_IMPORT', `Imported/Synced: Created ${result.created}, Updated ${result.updated}, Errors ${result.errors}`);
    } catch (err) {
        console.error("Import Failed:", err);
        res.status(500).json({ error: err.message });
    }
};
