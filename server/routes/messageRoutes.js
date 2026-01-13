const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.post('/', verifyToken, messageController.sendMessage);
router.get('/inbox', verifyToken, messageController.getInbox);
router.get('/sent', verifyToken, messageController.getSent);
router.get('/unread-count', verifyToken, messageController.getUnreadCount);
router.get('/recipients', verifyToken, messageController.getRecipients);
router.get('/conversations', verifyToken, messageController.getConversations);
router.get('/thread/:other_id', verifyToken, messageController.getThread);
router.get('/:id', verifyToken, messageController.getMessage);
router.put('/:id/read', verifyToken, messageController.markAsRead);
router.post('/typing', verifyToken, messageController.updateTypingStatus);
router.get('/typing/:other_id', verifyToken, messageController.getTypingStatus);
router.delete('/:id', verifyToken, messageController.deleteMessage);

module.exports = router;
