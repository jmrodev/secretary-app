const { pool } = require('../db');

/**
 * Logs a user action to the database asynchronously.
 * @param {Object} req - The Express request object (to extract user/IP).
 * @param {string} action - The action name (e.g., 'LOGIN', 'CREATE_APPT').
 * @param {Object|string} details - Additional details.
 */
exports.logAction = async (req, action, details) => {
    try {
        const user_id = req.user ? req.user.user_id : null;
        let username = req.user ? req.user.username : (req.body.username || 'Anonymous');
        const ip_address = req.ip || req.socket.remoteAddress;

        let detailsStr = details;
        if (typeof details === 'object') {
            detailsStr = JSON.stringify(details);
        }

        // Fire and forget - don't await this in the main controller flow usually, 
        // but we need a connection.

        // We use a fresh connection or the pool directly.
        // Using pool.execute is better for one-offs.

        const query = "INSERT INTO audit_logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)";
        await pool.query(query, [user_id, username, action, detailsStr, ip_address]);

    } catch (err) {
        // Silently fail or log to console so we don't crash the main app
        console.error("[Audit Log Error]", err);
    }
};
