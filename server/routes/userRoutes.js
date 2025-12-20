const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isSecretary } = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);

// Specific patient details (for doctors/secretaries)
router.get('/patients/:id', verifyToken, userController.getPatientDetails);
router.put('/patients/:id', verifyToken, userController.updatePatientDetails);

// List routes
router.get('/doctors', verifyToken, userController.getAllDoctors);
router.put('/doctors/:id', verifyToken, userController.updateDoctor);
router.get('/patients', verifyToken, userController.getAllPatients);

// Admin routes
router.get('/admin/users', verifyToken, userController.getUsersForAdmin);
router.post('/admin/reset-password/:id', verifyToken, userController.adminResetPassword);
router.post('/admin/users', verifyToken, userController.createUser);
router.put('/admin/users/:id', verifyToken, userController.updateUser);
router.delete('/admin/users/:id', verifyToken, userController.deleteUser);

module.exports = router;
