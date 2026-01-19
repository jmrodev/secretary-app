const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insuranceController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

// Public read (necessary for QR registration)
router.get('/', insuranceController.getAllInsurances);
router.get('/:id', verifyToken, insuranceController.getInsuranceById);

// Admin/Secretary write access
router.post('/', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), insuranceController.createInsurance);
router.put('/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), insuranceController.updateInsurance);
router.delete('/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), insuranceController.deleteInsurance);

module.exports = router;
