const messageRepository = require('../repositories/messageRepository');

/**
 * MessageService
 * Handles business logic for internal messaging.
 */
class MessageService {
    async sendMessage(senderId, data) {
        if (!data.message || data.message.trim() === '') {
            throw new Error("Message content is required");
        }
        return await messageRepository.create({
            sender_id: senderId,
            ...data
        });
    }

    async getInbox(userId) {
        return await messageRepository.findInbox(userId);
    }

    async getSent(userId) {
        return await messageRepository.findSent(userId);
    }

    async getMessage(id, userId) {
        const msg = await messageRepository.findById(id, userId);
        if (!msg) throw new Error("Message not found");
        return msg;
    }

    async markAsRead(id, recipientId) {
        return await messageRepository.markAsRead(id, recipientId);
    }

    async deleteMessage(id, senderId) {
        const result = await messageRepository.delete(id, senderId);
        if (result.affectedRows === 0) {
            throw new Error("Message not found or unauthorized");
        }
        return result;
    }

    async getUnreadCount(userId) {
        return await messageRepository.getUnreadCount(userId);
    }

    async getConversations(userId) {
        const convos = await messageRepository.getConversations(userId);
        // Mark as delivered in background
        messageRepository.markDelivered(userId).catch(console.error);
        return convos;
    }

    async getThread(userId, otherId) {
        const messages = await messageRepository.getThread(userId, otherId);
        // Mark thread as read
        messageRepository.markThreadRead(userId, otherId).catch(console.error);
        return messages;
    }

    async getRecipients(userId) {
        return await messageRepository.getPossibleRecipients(userId);
    }

    async updateTypingStatus(userId, targetId) {
        return await messageRepository.updateTypingStatus(userId, targetId);
    }

    async getTypingStatus(otherId, userId) {
        return await messageRepository.getTypingStatus(otherId, userId);
    }
}

module.exports = new MessageService();
