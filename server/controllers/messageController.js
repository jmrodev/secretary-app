const { pool } = require('../db');
const { logAction } = require('../utils/audit');

// Send a message
exports.sendMessage = async (req, res) => {
    let conn;
    try {
        const { user_id } = req.user;
        const { recipient_id, recipient_type, subject, message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).send("Message content is required");
        }

        conn = await pool.getConnection();

        // Insert message
        const result = await conn.query(
            "INSERT INTO messages (sender_id, recipient_id, recipient_type, subject, message) VALUES (?, ?, ?, ?, ?)",
            [user_id, recipient_id || null, recipient_type || 'individual', subject || null, message]
        );

        logAction(req, 'SEND_MESSAGE', `To: ${recipient_type === 'all_staff' ? 'All Staff' : recipient_id}`);
        res.status(201).json({ id: Number(result.insertId), message: "Message sent successfully" });

    } catch (err) {
        console.error("sendMessage Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Get inbox messages (Linear/Fallback)
exports.getInbox = async (req, res) => {
    let conn;
    try {
        const { user_id } = req.user;
        conn = await pool.getConnection();

        const messages = await conn.query(`
            SELECT m.*, u.username as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.recipient_id = ? OR (m.recipient_type = 'all_staff' AND m.recipient_id IS NULL))
            ORDER BY m.created_at DESC
        `, [user_id]);

        res.json(messages);

    } catch (err) {
        console.error("getInbox Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Get sent messages (Linear/Fallback)
exports.getSent = async (req, res) => {
    let conn;
    try {
        const { user_id } = req.user;
        conn = await pool.getConnection();

        const messages = await conn.query(
            `SELECT m.*, u.username as recipient_name
             FROM messages m
             LEFT JOIN users u ON m.recipient_id = u.id
             WHERE m.sender_id = ?
             ORDER BY m.created_at DESC`,
            [user_id]
        );

        res.json(messages);

    } catch (err) {
        console.error("getSent Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Get single message
exports.getMessage = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { user_id } = req.user;
        conn = await pool.getConnection();

        const messages = await conn.query(
            `SELECT m.*, 
                    sender.username as sender_name,
                    recipient.username as recipient_name
             FROM messages m
             JOIN users sender ON m.sender_id = sender.id
             LEFT JOIN users recipient ON m.recipient_id = recipient.id
             WHERE m.id = ? AND (m.sender_id = ? OR m.recipient_id = ? OR m.recipient_type = 'all_staff')`,
            [id, user_id, user_id]
        );

        if (messages.length === 0) {
            return res.status(404).send("Message not found");
        }

        res.json(messages[0]);

    } catch (err) {
        console.error("getMessage Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { user_id } = req.user;
        conn = await pool.getConnection();

        await conn.query(
            "UPDATE messages SET read_status = 2, read_at = NOW() WHERE id = ? AND recipient_id = ?",
            [id, user_id]
        );

        res.json({ message: "Message marked as read" });

    } catch (err) {
        console.error("markAsRead Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Delete message
exports.deleteMessage = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { user_id } = req.user;
        conn = await pool.getConnection();

        const result = await conn.query(
            "DELETE FROM messages WHERE id = ? AND sender_id = ?",
            [id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send("Message not found or you don't have permission");
        }

        logAction(req, 'DELETE_MESSAGE', `Message ID: ${id}`);
        res.json({ message: "Message deleted successfully" });

    } catch (err) {
        console.error("deleteMessage Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    let conn;
    try {
        const { user_id } = req.user;
        conn = await pool.getConnection();

        const result = await conn.query(
            `SELECT COUNT(*) as count FROM messages 
             WHERE (recipient_id = ? OR (recipient_type = 'all_staff' AND recipient_id IS NULL))
             AND read_status < 2`,
            [user_id]
        );

        const count = (result && result.length > 0) ? result[0].count : 0;
        res.json({ unread_count: Number(count) });

    } catch (err) {
        console.error("getUnreadCount Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Get list of conversations (latest message from each person)
exports.getConversations = async (req, res) => {
    let conn;
    try {
        const { user_id } = req.user;
        conn = await pool.getConnection();

        const conversations = await conn.query(
            `SELECT m.*, 
                    convo.other_user_id,
                    u.username as other_username,
                    COALESCE(d.full_name, s.full_name, u.username) as other_display_name,
                    (SELECT COUNT(*) FROM messages 
                     WHERE recipient_id = ? AND sender_id = convo.other_user_id AND read_status < 2) as unread_count
             FROM (
                SELECT MAX(id) as last_id, 
                       CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END as other_user_id
                FROM messages
                WHERE (sender_id = ? OR recipient_id = ?) AND recipient_type = 'individual'
                GROUP BY other_user_id
             ) convo
             JOIN messages m ON convo.last_id = m.id
             JOIN users u ON convo.other_user_id = u.id
             LEFT JOIN doctors d ON u.id = d.user_id
             LEFT JOIN secretaries s ON u.id = s.user_id
             ORDER BY m.created_at DESC`,
            [user_id, user_id, user_id, user_id]
        );

        // Mark incoming messages as Delivered (1) if they are currently Sent (0)
        await conn.query(
            "UPDATE messages SET read_status = 1, delivered_at = COALESCE(delivered_at, NOW()) WHERE recipient_id = ? AND read_status = 0",
            [user_id]
        );

        res.json(conversations);

    } catch (err) {
        console.error("getConversations Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Get all messages between current user and another user (Thread)
exports.getThread = async (req, res) => {
    let conn;
    try {
        const { user_id } = req.user;
        const { other_id } = req.params;
        conn = await pool.getConnection();

        const messages = await conn.query(
            `SELECT m.*, 
                    sender.username as sender_name,
                    recipient.username as recipient_name
             FROM messages m
             JOIN users sender ON m.sender_id = sender.id
             LEFT JOIN users recipient ON m.recipient_id = recipient.id
             WHERE ((m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?))
             AND m.recipient_type = 'individual'
             ORDER BY m.created_at ASC`,
            [user_id, other_id, other_id, user_id]
        );

        // Mark all as read when opening the thread
        await conn.query(
            "UPDATE messages SET read_status = 2, read_at = COALESCE(read_at, NOW()), delivered_at = COALESCE(delivered_at, NOW()) WHERE recipient_id = ? AND sender_id = ? AND read_status < 2",
            [user_id, other_id]
        );

        res.json(messages);

    } catch (err) {
        console.error("getThread Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Get list of users for recipient selection
exports.getRecipients = async (req, res) => {
    let conn;
    try {
        const { user_id } = req.user;
        conn = await pool.getConnection();

        const users = await conn.query(
            `SELECT u.id, u.username, u.role,
                    COALESCE(d.full_name, s.full_name, u.username) as display_name
             FROM users u
             LEFT JOIN doctors d ON u.id = d.user_id
             LEFT JOIN secretaries s ON u.id = s.user_id
             WHERE u.id != ? AND u.role IN ('doctor', 'secretary', 'admin')
             ORDER BY display_name`,
            [user_id]
        );

        res.json(users);

    } catch (err) {
        console.error("getRecipients Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Update typing status
exports.updateTypingStatus = async (req, res) => {
    let conn;
    try {
        const { user_id } = req.user;
        const { target_id } = req.body;
        conn = await pool.getConnection();

        await conn.query(
            "INSERT INTO user_typing_status (user_id, target_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE updated_at = NOW()",
            [user_id, target_id]
        );

        res.json({ message: "Typing status updated" });
    } catch (err) {
        console.error("updateTypingStatus Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};

// Get typing status
exports.getTypingStatus = async (req, res) => {
    let conn;
    try {
        const { other_id } = req.params;
        const { user_id } = req.user; // We check if other_id is typing to user_id
        conn = await pool.getConnection();

        const result = await conn.query(
            "SELECT 1 FROM user_typing_status WHERE user_id = ? AND target_id = ? AND updated_at > DATE_SUB(NOW(), INTERVAL 5 SECOND)",
            [other_id, user_id]
        );

        res.json({ is_typing: result.length > 0 });
    } catch (err) {
        console.error("getTypingStatus Error:", err);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        if (conn) conn.release();
    }
};
