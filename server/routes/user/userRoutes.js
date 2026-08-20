const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/user/profileController');
const patientManagementController = require('../../controllers/user/patientManagementController');
const doctorManagementController = require('../../controllers/user/doctorManagementController');
const userAccountController = require('../../controllers/user/userAccountController');
const reminderController = require('../../controllers/user/reminderController');
const userStatsController = require('../../controllers/user/userStatsController');
const restoreController = require('../../controllers/system/restoreController');

const { verifyToken } = require('../../middleware/authMiddleware');
const { authorize, authorizeCanManageUsers } = require('../../middleware/authorize');
const { ACCESS_LEVELS, ROLES } = require('../../constants/roles');
const validate = require('../../middleware/validationMiddleware');
const schemas = require('../../validators/userSchemas');

router.get('/profile', verifyToken, profileController.getProfile);
router.put('/profile', verifyToken, profileController.updateProfile);

// Specific patient details (for doctors/secretaries)
router.get('/patients/recent', verifyToken, patientManagementController.getRecentPatients);
router.get('/search/suggestions', verifyToken, patientManagementController.getSearchSuggestions);
router.get('/patients/:id', verifyToken, patientManagementController.getPatientDetails);
router.post('/patients/:id/restore', verifyToken, authorize(ACCESS_LEVELS.MANAGE_PATIENTS), restoreController.restoreItem);
router.put('/patients/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_PATIENTS), patientManagementController.updatePatientDetails);
router.put('/patients/:id/toggle-new', verifyToken, authorize(ACCESS_LEVELS.MANAGE_PATIENTS), patientManagementController.toggleNewPatientStatus);

// List routes
router.get('/doctors', verifyToken, doctorManagementController.getAllDoctors);
router.put('/doctors/:id', verifyToken, authorizeCanManageUsers, doctorManagementController.updateDoctor);
router.get('/patients', verifyToken, patientManagementController.getAllPatients);
router.get('/reminders', verifyToken, reminderController.getReminders);
router.post('/reminders/complete', verifyToken, validate(schemas.completeReminder), reminderController.completeReminder);
router.get('/stats', verifyToken, userStatsController.getStats);
router.get('/patients/stats/new', verifyToken, patientManagementController.getNewPatientStats);

// Admin routes
router.get('/admin/users', verifyToken, authorizeCanManageUsers, userAccountController.getUsersForAdmin);
router.post('/admin/reset-password/:id', verifyToken, authorizeCanManageUsers, validate(schemas.resetPassword), userAccountController.adminResetPassword);
router.post('/admin/users', verifyToken, authorizeCanManageUsers, validate(schemas.createUser), userAccountController.createUser);
router.put('/admin/users/:id', verifyToken, authorizeCanManageUsers, validate(schemas.updateUser), userAccountController.updateUser);
router.delete('/admin/users/:id', verifyToken, authorizeCanManageUsers, validate(schemas.deleteUser), userAccountController.deleteUser);

// Secretary management permission grants (GET: admin or granted secretary; POST: strictly admin)
router.get('/admin/users/permissions', verifyToken, authorizeCanManageUsers, userAccountController.getSecretaryPermissions);
router.post('/admin/users/permissions', verifyToken, authorize([ROLES.ADMIN]), validate(schemas.updateSecretaryPermissions), userAccountController.updateSecretaryPermissions);

module.exports = router;
