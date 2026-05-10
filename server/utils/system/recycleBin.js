const { pool } = require('../../db');

/**
 * Saves a copy of an entity before it's deleted or significantly modified.
 * @param {Object} req - Express request
 * @param {string} entityType - Type of entity (e.g. 'patient', 'appointment')
 * @param {number|string} entityId - ID of the entity
 * @param {string} entityName - Friendly name of the entity
 * @param {Object} data - The full data object to save
 */
exports.saveToRecycleBin = async (req, entityType, entityId, entityName, data) => {
    try {
        const userId = req.user ? req.user.user_id : null;
        const username = req.user ? req.user.username : 'System';

        // Expiration: 30 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Convert to SQL format (YYYY-MM-DD HH:mm:ss)
        const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

        const query = `
            INSERT INTO recycle_bin (entity_type, entity_id, entity_name, data, deleted_by_id, deleted_by_name, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await pool.query(query, [
            entityType,
            entityId,
            entityName,
            JSON.stringify(data),
            userId,
            username,
            expiresAtStr
        ]);

        console.log(`[RecycleBin] Saved ${entityType} ${entityId} (${entityName})`);
    } catch (err) {
        console.error("[RecycleBin Error]", err);
    }
};

/**
 * Cleans up expired items from the recycle bin.
 */
exports.cleanupRecycleBin = async () => {
    try {
        await pool.query("DELETE FROM recycle_bin WHERE expires_at < NOW()");
    } catch (err) {
        console.error("[RecycleBin Cleanup Error]", err);
    }
};
