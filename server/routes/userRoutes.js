const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isSecretary } = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);

// Specific patient details (for doctors/secretaries)
// Specific patient details (for doctors/secretaries)
router.get('/patients/:id', verifyToken, userController.getPatientDetails);
router.put('/patients/:id', verifyToken, isSecretary, userController.updatePatientDetails);
router.put('/patients/:id/toggle-new', verifyToken, isSecretary, userController.toggleNewPatientStatus);

// List routes
router.get('/doctors', verifyToken, userController.getAllDoctors);
router.put('/doctors/:id', verifyToken, isSecretary, userController.updateDoctor);
router.get('/patients', verifyToken, isSecretary, userController.getAllPatients);
router.get('/reminders', verifyToken, isSecretary, userController.getReminders);
router.get('/stats', verifyToken, isSecretary, userController.getStats);
router.get('/patients/stats/new', verifyToken, isSecretary, userController.getNewPatientStats);

// Admin routes
router.get('/admin/users', verifyToken, isSecretary, userController.getUsersForAdmin);
router.post('/admin/reset-password/:id', verifyToken, isSecretary, userController.adminResetPassword);
router.post('/admin/users', verifyToken, isSecretary, userController.createUser);
router.put('/admin/users/:id', verifyToken, isSecretary, userController.updateUser);
router.delete('/admin/users/:id', verifyToken, isSecretary, userController.deleteUser);

module.exports = router;
