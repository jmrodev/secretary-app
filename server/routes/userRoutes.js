const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);

// Specific patient details (for doctors/secretaries)
// Specific patient details (for doctors/secretaries)
router.get('/patients/:id', verifyToken, userController.getPatientDetails);
router.put('/patients/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_PATIENTS), userController.updatePatientDetails);
router.put('/patients/:id/toggle-new', verifyToken, authorize(ACCESS_LEVELS.MANAGE_PATIENTS), userController.toggleNewPatientStatus);

// List routes
router.get('/doctors', verifyToken, userController.getAllDoctors);
router.put('/doctors/:id', verifyToken, userController.updateDoctor);
router.get('/patients', verifyToken, userController.getAllPatients);
router.get('/reminders', verifyToken, userController.getReminders);
router.post('/reminders/complete', verifyToken, userController.completeReminder);
router.get('/stats', verifyToken, userController.getStats);
router.get('/patients/stats/new', verifyToken, userController.getNewPatientStats);

// Admin routes
router.get('/admin/users', verifyToken, authorize(ACCESS_LEVELS.MANAGE_USERS), userController.getUsersForAdmin);
router.post('/admin/reset-password/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_USERS), userController.adminResetPassword);
router.post('/admin/users', verifyToken, authorize(ACCESS_LEVELS.MANAGE_USERS), userController.createUser);
router.put('/admin/users/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_USERS), userController.updateUser);
router.delete('/admin/users/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_USERS), userController.deleteUser);

module.exports = router;
