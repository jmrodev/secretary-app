const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insuranceController');
const { verifyToken, isSecretary } = require('../middleware/authMiddleware');

// Public read (or authenticated) - let's keep it authenticated
router.get('/', verifyToken, insuranceController.getAllInsurances);
router.get('/:id', verifyToken, insuranceController.getInsuranceById);

// Admin/Secretary write access
router.post('/', verifyToken, isSecretary, insuranceController.createInsurance);
router.put('/:id', verifyToken, isSecretary, insuranceController.updateInsurance);
router.delete('/:id', verifyToken, isSecretary, insuranceController.deleteInsurance);

module.exports = router;
