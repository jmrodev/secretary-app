const express = require('express');
const router = express.Router();
const appointmentController = require('../../controllers/appointments');
const { verifyToken } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validationMiddleware');
const schemas = require('../../validators/appointmentSchemas');

router.get('/next-free', verifyToken, appointmentController.getNextFreeSlot);
router.get('/next-free-batch', verifyToken, appointmentController.getFreeSlotsBatch);
router.get('/', verifyToken, appointmentController.getAppointments);
router.post('/query', verifyToken, appointmentController.getAppointments);
router.post('/', verifyToken, validate(schemas.createAppointment), appointmentController.createAppointment);
router.put('/:id', verifyToken, appointmentController.updateAppointment);
router.put('/:id/status', verifyToken, validate(schemas.updateStatus), appointmentController.updateStatus);
router.patch('/:id/payment', verifyToken, validate(schemas.updatePayment), appointmentController.updatePaymentStatus);
router.patch('/:id/type', verifyToken, appointmentController.updateType);
router.post('/bulk-update-type', verifyToken, appointmentController.bulkUpdateType);
router.delete('/:id', verifyToken, appointmentController.deleteAppointment);

router.get('/stats', verifyToken, appointmentController.getCalendarStats);

router.get('/month-report', verifyToken, appointmentController.getMonthlyReport);
router.get('/daily-schedule', verifyToken, appointmentController.getDailySchedule);

module.exports = router;
