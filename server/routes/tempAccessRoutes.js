const express = require('express');
const router = express.Router();
const tempAccessController = require('../controllers/tempAccessController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

// Route to generate token (Protected - only staff should generate QRs)
router.post('/generate', verifyToken, authorize(ACCESS_LEVELS.MANAGE_PATIENTS), tempAccessController.generateToken);

// public routes for the patient device
router.get('/verify/:token', tempAccessController.verifyToken);
router.post('/complete/:token', tempAccessController.completeProfile);

module.exports = router;
