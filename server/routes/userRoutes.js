const express = require('express');
const router = express.Router();
const profileController = require('../controllers/user/profileController');
const patientManagementController = require('../controllers/user/patientManagementController');
const doctorManagementController = require('../controllers/user/doctorManagementController');
const userAccountController = require('../controllers/user/userAccountController');
const reminderController = require('../controllers/user/reminderController');
const userStatsController = require('../controllers/user/userStatsController');

const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

router.get('/profile', verifyToken, profileController.getProfile);
router.put('/profile', verifyToken, profileController.updateProfile);

// Specific patient details (for doctors/secretaries)
router.get('/patients/:id', verifyToken, patientManagementController.getPatientDetails);
router.put('/patients/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_PATIENTS), patientManagementController.updatePatientDetails);
router.put('/patients/:id/toggle-new', verifyToken, authorize(ACCESS_LEVELS.MANAGE_PATIENTS), patientManagementController.toggleNewPatientStatus);

// List routes
router.get('/doctors', verifyToken, doctorManagementController.getAllDoctors);
router.put('/doctors/:id', verifyToken, doctorManagementController.updateDoctor);
router.get('/patients', verifyToken, patientManagementController.getAllPatients);
router.get('/reminders', verifyToken, reminderController.getReminders);
router.post('/reminders/complete', verifyToken, reminderController.completeReminder);
router.get('/stats', verifyToken, userStatsController.getStats);
router.get('/patients/stats/new', verifyToken, patientManagementController.getNewPatientStats);

// Admin routes
router.get('/admin/users', verifyToken, authorize(ACCESS_LEVELS.MANAGE_USERS), userAccountController.getUsersForAdmin);
router.post('/admin/reset-password/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_USERS), userAccountController.adminResetPassword);
router.post('/admin/users', verifyToken, authorize(ACCESS_LEVELS.MANAGE_USERS), userAccountController.createUser);
router.put('/admin/users/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_USERS), userAccountController.updateUser);
router.delete('/admin/users/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_USERS), userAccountController.deleteUser);

module.exports = router;
