const express = require('express');
const router = express.Router();
const financeController = require('../../controllers/finance/financeController');
const { verifyToken } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorize');
const { ACCESS_LEVELS } = require('../../constants/roles');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Consolidated Transactions
router.get('/pricing', verifyToken, financeController.getPricing);
router.post('/pricing', verifyToken, financeController.getPricing);
router.post('/transactions', verifyToken, upload.single('proof'), financeController.createTransaction);
router.get('/transactions', verifyToken, financeController.getTransactions); // View logic handles roles
router.post('/transactions/close', verifyToken, financeController.closeCashBox);
router.put('/transactions/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_FINANCE), financeController.updateTransaction);
router.delete('/transactions/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_FINANCE), financeController.deleteTransaction);
router.post('/pay-debt', verifyToken, financeController.payDebt);
router.post('/pay-institution-debt', verifyToken, financeController.payInstitutionDebt);
router.get('/pending-closures', verifyToken, financeController.getPendingClosures);
router.get('/stats', verifyToken, authorize(ACCESS_LEVELS.MANAGE_FINANCE), financeController.getStats);
router.get('/transactions/audits', verifyToken, authorize(ACCESS_LEVELS.MANAGE_FINANCE), financeController.getTransactionAudits);

module.exports = router;
