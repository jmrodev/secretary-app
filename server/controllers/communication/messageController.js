const messageService = require('../../services/communication/messageService');
const { logAction } = require('../../utils/system/audit');

/**
 * messageController
 * Handles HTTP requests for internal messages.
 */

exports.sendMessage = async (req, res) => {
    try {
        const { user_id } = req.user;
        const msgId = await messageService.sendMessage(user_id, req.body);

        logAction(req, 'SEND_MESSAGE', `To: ${req.body.recipient_type === 'all_staff' ? 'All Staff' : req.body.recipient_id}`);
        res.status(201).json({ id: msgId, message: "Message sent successfully" });
    } catch (err) {
        console.error(err);
        if (err.message === "Message content is required") return res.status(400).send(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getInbox = async (req, res) => {
    try {
        const { user_id } = req.user;
        const messages = await messageService.getInbox(user_id);
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getSent = async (req, res) => {
    try {
        const { user_id } = req.user;
        const messages = await messageService.getSent(user_id);
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.user;
        const message = await messageService.getMessage(id, user_id);
        res.json(message);
    } catch (err) {
        console.error(err);
        if (err.message === "Message not found") return res.status(404).send(err.message);
        res.status(500).send("Server Error");
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.user;
        await messageService.markAsRead(id, user_id);
        res.json({ message: "Message marked as read" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.user;
        await messageService.deleteMessage(id, user_id);

        logAction(req, 'DELETE_MESSAGE', `Message ID: ${id}`);
        res.json({ message: "Message deleted successfully" });
    } catch (err) {
        console.error(err);
        if (err.message === "Message not found or unauthorized") return res.status(404).send(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const { user_id } = req.user;
        const count = await messageService.getUnreadCount(user_id);
        res.json({ unread_count: count });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getConversations = async (req, res) => {
    try {
        const { user_id } = req.user;
        const conversations = await messageService.getConversations(user_id);
        res.json(conversations);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getThread = async (req, res) => {
    try {
        const { user_id } = req.user;
        const { other_id } = req.params;
        const messages = await messageService.getThread(user_id, other_id);
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getRecipients = async (req, res) => {
    try {
        const { user_id } = req.user;
        const users = await messageService.getRecipients(user_id);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateTypingStatus = async (req, res) => {
    try {
        const { user_id } = req.user;
        const { target_id } = req.body;
        await messageService.updateTypingStatus(user_id, target_id);
        res.json({ message: "Typing status updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getTypingStatus = async (req, res) => {
    try {
        const { other_id } = req.params;
        const { user_id } = req.user;
        const isTyping = await messageService.getTypingStatus(other_id, user_id);
        res.json({ is_typing: isTyping });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};
