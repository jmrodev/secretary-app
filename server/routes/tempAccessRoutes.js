const express = require('express');
const router = express.Router();
const tempAccessController = require('../controllers/tempAccessController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route to generate token (Protected - only staff should generate QRs)
// We might need to ensure 'verifyToken' allows secretaries/admins.
// Assuming verifyToken checks for valid JWT in header.
router.post('/generate', verifyToken, tempAccessController.generateToken);

// public routes for the patient device
router.get('/verify/:token', tempAccessController.verifyToken);
router.post('/complete/:token', tempAccessController.completeProfile);

module.exports = router;
