const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { verifyToken, isSecretary, isAdmin } = require('../middleware/authMiddleware');

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
router.post('/transactions', verifyToken, upload.single('proof'), financeController.createTransaction);
router.get('/transactions', verifyToken, financeController.getTransactions); // View logic handles roles
router.post('/transactions/close', verifyToken, financeController.closeCashBox);
router.post('/pay-debt', verifyToken, financeController.payDebt);
router.get('/stats', verifyToken, isSecretary, financeController.getStats);

module.exports = router;
