const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, appointmentController.getAppointments);
router.post('/', verifyToken, appointmentController.createAppointment);
router.put('/:id', verifyToken, appointmentController.updateAppointment);
router.put('/:id/status', verifyToken, appointmentController.updateStatus);
router.patch('/:id/payment', verifyToken, appointmentController.updatePaymentStatus);
router.delete('/:id', verifyToken, appointmentController.deleteAppointment);

module.exports = router;
