

/**
 * MessageRepository
 * Handles data access for internal messages.
 */
class MessageRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async create(data, conn = this.pool) {
        const query = "INSERT INTO messages (sender_id, recipient_id, recipient_type, subject, message) VALUES (?, ?, ?, ?, ?)";
        const result = await conn.query(query, [
            data.sender_id,
            data.recipient_id || null,
            data.recipient_type || 'individual',
            data.subject || null,
            data.message
        ]);
        return Number(result.insertId);
    }

    async findInbox(userId, conn = this.pool) {
        return await conn.query(`
            SELECT m.*, u.username as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.recipient_id = ? OR (m.recipient_type = 'all_staff' AND m.recipient_id IS NULL))
            ORDER BY m.created_at DESC
        `, [userId]);
    }

    async findSent(userId, conn = this.pool) {
        return await conn.query(`
            SELECT m.*, u.username as recipient_name
            FROM messages m
            LEFT JOIN users u ON m.recipient_id = u.id
            WHERE m.sender_id = ?
            ORDER BY m.created_at DESC
        `, [userId]);
    }

    async findById(id, userId, conn = this.pool) {
        const rows = await conn.query(`
            SELECT m.*, 
                   sender.username as sender_name,
                   recipient.username as recipient_name
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN users recipient ON m.recipient_id = recipient.id
            WHERE m.id = ? AND (m.sender_id = ? OR m.recipient_id = ? OR m.recipient_type = 'all_staff')
        `, [id, userId, userId]);
        return rows.length > 0 ? rows[0] : null;
    }

    async markAsRead(id, recipientId, conn = this.pool) {
        return await conn.query(
            "UPDATE messages SET read_status = 2, read_at = NOW() WHERE id = ? AND recipient_id = ?",
            [id, recipientId]
        );
    }

    async delete(id, senderId, conn = this.pool) {
        return await conn.query(
            "DELETE FROM messages WHERE id = ? AND sender_id = ?",
            [id, senderId]
        );
    }

    async getUnreadCount(userId, conn = this.pool) {
        const result = await conn.query(`
            SELECT COUNT(*) as count FROM messages 
            WHERE (recipient_id = ? OR (recipient_type = 'all_staff' AND recipient_id IS NULL))
            AND read_status < 2
        `, [userId]);
        return Number(result[0].count);
    }

    async getConversations(userId, conn = this.pool) {
        return await conn.query(`
            SELECT m.*, 
                    convo.other_user_id,
                    u.username as other_username,
                    COALESCE(d.full_name, s.full_name, p.full_name, u.username) as other_display_name,
                    COALESCE(d.phone, s.phone, p.phone) as other_phone,
                    COALESCE(un.unread_count, 0) as unread_count
             FROM (
                SELECT MAX(id) as last_id, 
                       IF(sender_id = ?, recipient_id, sender_id) as other_user_id
                FROM messages
                WHERE (sender_id = ? OR recipient_id = ?) AND recipient_type = 'individual'
                GROUP BY IF(sender_id = ?, recipient_id, sender_id)
             ) convo
             JOIN messages m ON convo.last_id = m.id
             JOIN users u ON convo.other_user_id = u.id
             LEFT JOIN doctors d ON u.id = d.user_id
             LEFT JOIN secretaries s ON u.id = s.user_id
             LEFT JOIN patients p ON u.id = p.user_id
             LEFT JOIN (
                SELECT sender_id, recipient_id, COUNT(*) as unread_count
                FROM messages
                WHERE recipient_id = ? AND read_status < 2
                GROUP BY sender_id, recipient_id
             ) un ON un.sender_id = convo.other_user_id
             ORDER BY m.created_at DESC
        `, [userId, userId, userId, userId, userId]);
    }

    async markDelivered(userId, conn = this.pool) {
        return await conn.query(
            "UPDATE messages SET read_status = 1, delivered_at = NOW() WHERE recipient_id = ? AND read_status = 0",
            [userId]
        );
    }

    async getThread(userId, otherId, conn = this.pool) {
        return await conn.query(`
            SELECT m.*, 
                    sender.username as sender_name,
                    recipient.username as recipient_name
             FROM messages m
             JOIN users sender ON m.sender_id = sender.id
             LEFT JOIN users recipient ON m.recipient_id = recipient.id
             WHERE ((m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?))
             AND m.recipient_type = 'individual'
             ORDER BY m.created_at ASC
        `, [userId, otherId, otherId, userId]);
    }

    async markThreadRead(userId, otherId, conn = this.pool) {
        return await conn.query(
            "UPDATE messages SET read_status = 2, read_at = COALESCE(read_at, NOW()), delivered_at = COALESCE(delivered_at, NOW()) WHERE recipient_id = ? AND sender_id = ? AND read_status < 2",
            [userId, otherId]
        );
    }

    async getPossibleRecipients(userId, conn = this.pool) {
        return await conn.query(`
            SELECT u.id, u.username, u.role,
                    COALESCE(d.full_name, s.full_name, u.username) as display_name
             FROM users u
             LEFT JOIN doctors d ON u.id = d.user_id
             LEFT JOIN secretaries s ON u.id = s.user_id
             WHERE u.id != ? AND u.role IN ('doctor', 'secretary', 'admin')
             ORDER BY display_name
        `, [userId]);
    }

    async updateTypingStatus(userId, targetId, conn = this.pool) {
        return await conn.query(
            "INSERT INTO user_typing_status (user_id, target_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE updated_at = NOW()",
            [userId, targetId]
        );
    }

    async getTypingStatus(otherId, userId, conn = this.pool) {
        const result = await conn.query(
            "SELECT 1 FROM user_typing_status WHERE user_id = ? AND target_id = ? AND updated_at > DATE_SUB(NOW(), INTERVAL 5 SECOND)",
            [otherId, userId]
        );
        return result.length > 0;
    }
}

module.exports = (pool) => new MessageRepository(pool);
