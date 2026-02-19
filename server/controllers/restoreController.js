const restoreService = require('../services/restoreService');

/**
 * restoreItem
 * Delegating restoration logic to RestoreService.
 */
exports.restoreItem = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await restoreService.restoreItem(req, id);
        res.json(result);
    } catch (err) {
        console.error("[Restore Error]", err);
        res.status(500).json({ message: "Failed to restore item: " + err.message });
    }
};
