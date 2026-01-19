const { pool } = require('../db');

/**
 * Utility to log CRUD operations with specific before/after state.
 */
exports.logCRUD = async (req, action, entityType, entityId, oldData, newData) => {
    const details = {
        entityType,
        entityId,
        changes: {
            from: oldData,
            to: newData
        }
    };
    return exports.logAction(req, action, details);
};

exports.logAction = async (req, action, details) => {
    try {
        const user_id = req.user ? req.user.user_id : null;
        let username = req.user ? req.user.username : (req.body.username || 'Anonymous');
        const ip_address = req.ip || req.socket.remoteAddress;

        let detailsStr = details;
        if (typeof details === 'object') {
            detailsStr = JSON.stringify(details);
        }

        const query = "INSERT INTO audit_logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)";
        await pool.query(query, [user_id, username, action, detailsStr, ip_address]);

    } catch (err) {
        console.error("[Audit Log Error]", err);
    }
};
