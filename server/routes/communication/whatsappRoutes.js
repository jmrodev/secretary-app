const express = require('express');
const router = express.Router();
const whatsappController = require('../../controllers/communication/whatsappController');
const { verifyToken } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorize');
const { ACCESS_LEVELS } = require('../../constants/roles');
const { validateSendMessage, validateSendDirect, validateBroadcast, validateSuggestAlternative, validatePendingId, validateHistory, validateDeleteConversation, validateTestConnection, validateBroadcastDirect, validateBroadcastPreview, validateWebhook, verifyBridgeSecret } = require('../../middleware/validateWhatsapp');

// Webhook from Go Bridge — machine-to-machine auth via X-Bridge-Secret (not user verifyToken).
// This is an intentional exception to the verifyToken+authorize rule: the bridge has no user JWT,
// it authenticates with a shared secret (WHATSAPP_BRIDGE_SECRET) set in both services.
router.post('/webhook', verifyBridgeSecret, validateWebhook, whatsappController.receiveWebhook);

// Apply generic token verification to all routes
router.use(verifyToken);

// Get WhatsApp history for a patient (POST to avoid sensitive data in URL)
router.post('/history', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateHistory, whatsappController.getPatientHistory);


// Supervised WhatsApp auto-booking: pending bookings queue (secretary approval)
router.get('/pending-bookings', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.listPending);
router.post('/pending-bookings/:id/accept', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validatePendingId, whatsappController.acceptPending);
router.post('/pending-bookings/:id/suggest-alternative', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validatePendingId, validateSuggestAlternative, whatsappController.suggestAlternative);
router.post('/pending-bookings/:id/reject', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validatePendingId, whatsappController.rejectPending);

// Get recent conversations for the global messenger inbox
router.get('/recent', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.getRecentConversations);

// Delete a conversation history
router.post('/delete-conversation', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateDeleteConversation, whatsappController.deleteConversation);

// Send a single message (e.g. from Appointment Flow) - Allowed for Secretary/Doctor
router.post('/send', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateSendMessage, whatsappController.sendMessage);

// Send a direct message via local bridge
router.post('/send-direct', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateSendDirect, whatsappController.sendDirectMessage);

// Broadcast - Maybe restricted to higher roles? Let's keep it generally consistent for now.
router.post('/broadcast', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateBroadcast, whatsappController.broadcastMessage);

// Test Connection - Admin Config only
router.post('/test', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateTestConnection, whatsappController.testConnection);

// Bridge Status (Internal check) - token-gated, contains QR pairing secret
router.get('/status', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.getBridgeStatus);

// Bridge Health (Docker healthcheck / liveness, token-gated)
router.get('/health', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.getBridgeHealth);

router.post('/logout', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.logoutBridge);

// Refresh Bridge Pairing (regenerate QR code)
router.post('/refresh', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), whatsappController.refreshBridge);

// Broadcast via local bridge (plain text, with delay)
router.post('/broadcast-direct', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateBroadcastDirect, whatsappController.broadcastDirect);

// Preview recipient count without sending
router.post('/broadcast-preview', authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), validateBroadcastPreview, whatsappController.broadcastPreview);

module.exports = router;
