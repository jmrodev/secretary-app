const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/next-free', verifyToken, appointmentController.getNextFreeSlot);
router.get('/next-free-batch', verifyToken, appointmentController.getFreeSlotsBatch);
router.get('/', verifyToken, appointmentController.getAppointments);
router.post('/', verifyToken, appointmentController.createAppointment);
router.put('/:id', verifyToken, appointmentController.updateAppointment);
router.put('/:id/status', verifyToken, appointmentController.updateStatus);
router.patch('/:id/payment', verifyToken, appointmentController.updatePaymentStatus);
router.patch('/:id/type', verifyToken, appointmentController.updateType);
router.post('/bulk-update-type', verifyToken, appointmentController.bulkUpdateType);
router.delete('/:id', verifyToken, appointmentController.deleteAppointment);

router.get('/stats', verifyToken, appointmentController.getCalendarStats);

router.get('/month-report', verifyToken, appointmentController.getMonthlyReport);

module.exports = router;
