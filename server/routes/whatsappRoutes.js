const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

// Apply generic token verification to all routes
router.use(verifyToken);

// Send a single message (e.g. from Appointment Flow) - Allowed for Secretary/Doctor
router.post('/send', whatsappController.sendMessage);

// Send a direct message via local bridge
router.post('/send-direct', whatsappController.sendDirectMessage);

// Broadcast - Maybe restricted to higher roles? Let's keep it generally consistent for now.
router.post('/broadcast', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.broadcastMessage);

// Test Connection - Admin Config only
router.post('/test', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.testConnection);

module.exports = router;
