const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/google/googleAuthController');
const googleCalendarController = require('../controllers/google/googleCalendarController');
const googleContactController = require('../controllers/google/googleContactController');
const googleSpreadsheetController = require('../controllers/google/googleSpreadsheetController');
const googleSpreadsheetService = require('../services/google/GoogleSpreadsheetService');

const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

// Auth
router.get('/auth-url', verifyToken, googleAuthController.getAuthUrl);
router.get('/callback', googleAuthController.oauthCallback);
router.get('/status', verifyToken, googleAuthController.getStatus);
router.post('/disconnect', verifyToken, googleAuthController.disconnect);

// Contacts
router.post('/import', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleContactController.importContacts);

// Calendar & Sync
router.post('/sync-day', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleCalendarController.syncDayToGoogle);
router.post('/retry-failed', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleCalendarController.retryFailedItems);
router.get('/appointments', verifyToken, googleCalendarController.listAppointments);
router.post('/appointments', verifyToken, googleCalendarController.createAppointment);
router.delete('/appointments/:eventId', verifyToken, googleCalendarController.deleteEvent);

// Audit & Sanitization
router.get('/audit-appointments', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleCalendarController.getAuditAppointments);
router.post('/sanitize/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleCalendarController.sanitizeAppointment);

// Spreadsheets
router.post('/reset-spreadsheet', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), googleSpreadsheetController.resetSpreadsheet);
router.post('/sync-transaction/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_INTEGRATIONS), (req, res) => {
    const { id } = req.params;
    googleSpreadsheetService.syncToSpreadsheet(id, req.user.user_id)
        .then(() => res.json({ message: 'Sincronización manual completada' }))
        .catch(err => res.status(500).json({ error: err.message }));
});

module.exports = router;

