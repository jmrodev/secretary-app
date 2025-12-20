const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, appointmentController.createAppointment);
router.get('/', verifyToken, appointmentController.getAppointments);

// Update status
router.patch('/:id/status', verifyToken, appointmentController.updateStatus);
router.patch('/:id/payment', verifyToken, appointmentController.updatePaymentStatus);

module.exports = router;
