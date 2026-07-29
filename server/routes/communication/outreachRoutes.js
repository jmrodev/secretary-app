const express = require('express');
const router = express.Router();
const outreachController = require('../../controllers/communication/outreachController');
const { verifyToken } = require('../../middleware/authMiddleware');

// GET /api/outreach/segments — Get patients by segment type
router.get('/segments', verifyToken, outreachController.getSegments);

// POST /api/outreach/send — Send broadcast to selected patients
router.post('/send', verifyToken, outreachController.sendBroadcast);

module.exports = router;
