const express = require('express');
const router = express.Router();
const googleController = require('../controllers/googleController');

const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

router.get('/auth-url', verifyToken, googleController.getAuthUrl);
router.get('/callback', googleController.oauthCallback); // Public: Browser redirect
router.get('/status', verifyToken, googleController.getStatus);
router.post('/disconnect', verifyToken, googleController.disconnect);
router.post('/import', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleController.importContacts);
router.post('/sync-import', verifyToken, googleController.syncImportEvents); // Import events from Google
router.post('/sync-day', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleController.syncDayToGoogle); // Sync specific day to Google
router.post('/retry-failed', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleController.retryFailedItems); // Retry stalled items
router.get('/appointments', verifyToken, googleController.listAppointments);
router.post('/appointments', verifyToken, googleController.createAppointment);
router.delete('/appointments/:eventId', verifyToken, googleController.deleteEvent);

// Sanitization Tool
router.get('/audit-appointments', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleController.getAuditAppointments);
router.post('/sanitize/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleController.sanitizeAppointment);

module.exports = router;
