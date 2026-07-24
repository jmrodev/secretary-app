const auditRepository = require('../../repositories/system/auditRepository');

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
        const ip_address = req?.ip || req?.socket?.remoteAddress || req?.connection?.remoteAddress || '127.0.0.1';

        let detailsStr = details;
        if (typeof details === 'object') {
            detailsStr = JSON.stringify(details);
        }

        await auditRepository.create({
            user_id,
            username,
            action,
            details: detailsStr,
            ip_address
        });

    } catch (err) {
        console.error("[Audit Log Error]", err);
    }
};
