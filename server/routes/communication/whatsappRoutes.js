const express = require('express');
const router = express.Router();
const whatsappController = require('../../controllers/communication/whatsappController');
const { verifyToken } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorize');
const { ACCESS_LEVELS } = require('../../constants/roles');
const { validateSendMessage, validateSendDirect, validateBroadcast } = require('../../middleware/validateWhatsapp');

// Webhook from Go Bridge (Public access for the local bridge)
router.post('/webhook', whatsappController.receiveWebhook);

// Apply generic token verification to all routes
router.use(verifyToken);

// Get WhatsApp history for a patient (POST to avoid sensitive data in URL)
router.post('/history', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.getPatientHistory);


// Supervised WhatsApp auto-booking: pending bookings queue (secretary approval)
router.get('/pending-bookings', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.listPending);
router.post('/pending-bookings/:id/accept', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.acceptPending);
router.post('/pending-bookings/:id/suggest-alternative', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.suggestAlternative);
router.post('/pending-bookings/:id/reject', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.rejectPending);

// Get recent conversations for the global messenger inbox
router.get('/recent', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.getRecentConversations);

// Delete a conversation history
router.post('/delete-conversation', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.deleteConversation);

// Send a single message (e.g. from Appointment Flow) - Allowed for Secretary/Doctor
router.post('/send', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateSendMessage, whatsappController.sendMessage);

// Send a direct message via local bridge
router.post('/send-direct', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateSendDirect, whatsappController.sendDirectMessage);

// Broadcast - Maybe restricted to higher roles? Let's keep it generally consistent for now.
router.post('/broadcast', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateBroadcast, whatsappController.broadcastMessage);

// Test Connection - Admin Config only
router.post('/test', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.testConnection);

// Bridge Status (Internal check) - token-gated, contains QR pairing secret
router.get('/status', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.getBridgeStatus);

// Bridge Health (Docker healthcheck / liveness, token-gated)
router.get('/health', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.getBridgeHealth);

router.post('/logout', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.logoutBridge);

// Refresh Bridge Pairing (regenerate QR code)
router.post('/refresh', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.refreshBridge);

// Broadcast via local bridge (plain text, with delay)
router.post('/broadcast-direct', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.broadcastDirect);

// Preview recipient count without sending
router.post('/broadcast-preview', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.broadcastPreview);

module.exports = router;
