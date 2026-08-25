const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/appointments/booking');
const modificationController = require('../../controllers/appointments/modification');
const retrievalController = require('../../controllers/appointments/retrieval');
const availabilityController = require('../../controllers/appointments/availability');
const { verifyToken } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validationMiddleware');
const schemas = require('../../validators/appointmentSchemas');

router.get('/next-free', verifyToken, availabilityController.getNextFreeSlot);
router.get('/next-free-batch', verifyToken, availabilityController.getFreeSlotsBatch);
router.get('/stats', verifyToken, availabilityController.getCalendarStats);
router.get('/month-report', verifyToken, retrievalController.getMonthlyReport);
router.get('/daily-schedule', verifyToken, retrievalController.getDailySchedule);
router.get('/', verifyToken, retrievalController.getAppointments);
router.get('/:id', verifyToken, retrievalController.getAppointmentById);
router.post('/', verifyToken, validate(schemas.createAppointment), bookingController.createAppointment);
router.put('/:id', verifyToken, modificationController.updateAppointment);
router.put('/:id/status', verifyToken, validate(schemas.updateStatus), modificationController.updateStatus);
router.patch('/:id/payment', verifyToken, validate(schemas.updatePayment), modificationController.updatePaymentStatus);
router.patch('/:id/type', verifyToken, modificationController.updateType);
router.post('/bulk-update-type', verifyToken, modificationController.bulkUpdateType);
router.delete('/:id', verifyToken, modificationController.deleteAppointment);

module.exports = router;
