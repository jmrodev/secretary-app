const express = require('express');
const router = express.Router();
const whatsappController = require('../../controllers/communication/whatsappController');
const { verifyToken } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorize');
const { ACCESS_LEVELS } = require('../../constants/roles');

// Webhook from Go Bridge (Public access for the local bridge)
router.post('/webhook', whatsappController.receiveWebhook);

// Apply generic token verification to all routes
router.use(verifyToken);

// Get WhatsApp history for a patient (POST to avoid sensitive data in URL)
router.post('/history', whatsappController.getPatientHistory);

// Get AI suggestion for a response
router.post('/ai-suggestion', whatsappController.getAiSuggestion);

// Get recent conversations for the global messenger inbox
router.get('/recent', whatsappController.getRecentConversations);

// Send a single message (e.g. from Appointment Flow) - Allowed for Secretary/Doctor
router.post('/send', whatsappController.sendMessage);

// Send a direct message via local bridge
router.post('/send-direct', whatsappController.sendDirectMessage);

// Broadcast - Maybe restricted to higher roles? Let's keep it generally consistent for now.
router.post('/broadcast', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.broadcastMessage);

// Test Connection - Admin Config only
router.post('/test', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.testConnection);

// Bridge Status (Internal check)
router.get('/status', whatsappController.getBridgeStatus);

router.post('/logout', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.logoutBridge);

// Refresh Bridge Pairing (regenerate QR code)
router.post('/refresh', whatsappController.refreshBridge);

// Broadcast via local bridge (plain text, with delay)
router.post('/broadcast-direct', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.broadcastDirect);

// Preview recipient count without sending
router.post('/broadcast-preview', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.broadcastPreview);

module.exports = router;
