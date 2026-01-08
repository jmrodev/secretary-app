const express = require('express');
const router = express.Router();
const googleController = require('../controllers/googleController');

const { verifyToken, isSecretary } = require('../middleware/authMiddleware');

router.get('/auth-url', verifyToken, googleController.getAuthUrl);
router.get('/callback', googleController.oauthCallback); // Public: Browser redirect
router.get('/status', verifyToken, googleController.getStatus);
router.post('/disconnect', verifyToken, googleController.disconnect);
router.post('/import', verifyToken, isSecretary, googleController.importContacts);
router.get('/appointments', verifyToken, googleController.listAppointments);
router.post('/appointments', verifyToken, googleController.createAppointment);
router.delete('/appointments/:eventId', verifyToken, googleController.deleteEvent);

module.exports = router;
