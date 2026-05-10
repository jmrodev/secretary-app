const { pool } = require('../../db');

/**
 * PhoneRepository
 * Handles data access for the phone_numbers table across different entities.
 */
class PhoneRepository {
    async findByEntity(entityType, entityId, conn = pool) {
        return await conn.query(`
            SELECT id, phone_number, is_primary, label 
            FROM phone_numbers 
            WHERE entity_type = ? AND entity_id = ?
            ORDER BY is_primary DESC, created_at ASC
        `, [entityType, entityId]);
    }

    async findByEntities(entityType, entityIds, conn = pool) {
        if (!entityIds || entityIds.length === 0) return {};
        const rows = await conn.query(
            "SELECT * FROM phone_numbers WHERE entity_type = ? AND entity_id IN (?)",
            [entityType, entityIds]
        );

        return rows.reduce((acc, phone) => {
            if (!acc[phone.entity_id]) acc[phone.entity_id] = [];
            acc[phone.entity_id].push(phone);
            return acc;
        }, {});
    }

    async syncPhones(entityType, entityId, phoneNumbers, conn = pool) {
        if (!Array.isArray(phoneNumbers)) return null;

        await conn.query("DELETE FROM phone_numbers WHERE entity_type = ? AND entity_id = ?", [entityType, entityId]);

        let primaryPhone = '';
        for (const pn of phoneNumbers) {
            await conn.query(
                "INSERT INTO phone_numbers (entity_type, entity_id, phone_number, is_primary, label) VALUES (?, ?, ?, ?, ?)",
                [entityType, entityId, pn.phone_number, pn.is_primary ? 1 : 0, pn.label || 'Celular']
            );
            if (pn.is_primary) primaryPhone = pn.phone_number;
        }

        if (!primaryPhone && phoneNumbers.length > 0) primaryPhone = phoneNumbers[0].phone_number;
        return primaryPhone;
    }
}

module.exports = new PhoneRepository();
