
const { pool } = require('./db');
const jwt = require('jsonwebtoken');

(async () => {
    let conn;
    try {
        console.log("Connecting...");
        conn = await pool.getConnection();
        console.log("Connected.");

        // Simulate User ID (Admin is usually 9 or similar, let's look up)
        const [admin] = await conn.query("SELECT id, username FROM users WHERE username = 'admin'");
        if (!admin) throw new Error("Admin not found");
        console.log("Admin User:", admin);
        const user_id = admin.id;

        // Test getUnreadCount Query
        console.log("Testing getUnreadCount query...");
        const unreadRes = await conn.query(
            `SELECT COUNT(*) as count FROM messages 
             WHERE (recipient_id = ? OR (recipient_type = 'all_staff' AND recipient_id IS NULL))
             AND read_status < 2`,
            [user_id]
        );
        console.log("Unread Result:", unreadRes);

        // Test getConversations Query
        console.log("Testing getConversations query...");
        const conversations = await conn.query(
            `SELECT m.*, 
                    convo.other_user_id,
                    u.username as other_username,
                    COALESCE(d.full_name, s.full_name, u.username) as other_display_name,
                    COALESCE(d.phone, s.phone, p.phone) as other_phone,
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
             LEFT JOIN patients p ON u.id = p.user_id
             ORDER BY m.created_at DESC`,
            [user_id, user_id, user_id, user_id]
        );
        console.log(`Conversations found: ${conversations.length}`);

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
})();
