const express = require('express');

module.exports = (financeController) => {
    const router = express.Router();
    const { verifyToken } = require('../../middleware/authMiddleware');
    const { authorize, authorizePermission } = require('../../middleware/authorize');
    const { ACCESS_LEVELS } = require('../../constants/roles');
    const multer = require('multer');
    const path = require('path');

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
    });
    const upload = multer({ storage });

    router.get('/pricing', verifyToken, financeController.getPricing);
    router.post('/pricing', verifyToken, financeController.getPricing);
    router.post('/transactions', verifyToken, authorizePermission('can_crud_finances'), upload.single('proof'), financeController.createTransaction);
    router.get('/transactions', verifyToken, financeController.getTransactions);
    
    // ECC: Cash Box Balancing
    router.post('/cash-box/balancing', verifyToken, authorizePermission('can_crud_finances'), financeController.performBalancing);
    
    router.post('/transactions/close', verifyToken, authorizePermission('can_crud_finances'), financeController.closeCashBox);
    router.put('/transactions/:id', verifyToken, authorizePermission('can_crud_finances'), financeController.updateTransaction);
    router.delete('/transactions/:id', verifyToken, authorizePermission('can_crud_finances'), financeController.deleteTransaction);
    router.post('/pay-debt', verifyToken, authorizePermission('can_crud_finances'), financeController.payDebt);
    router.post('/pay-institution-debt', verifyToken, authorizePermission('can_crud_finances'), financeController.payInstitutionDebt);
    router.get('/pending-closures', verifyToken, financeController.getPendingClosures);
    router.get('/stats', verifyToken, authorize(ACCESS_LEVELS.MANAGE_FINANCE), financeController.getStats);
    router.get('/transactions/audits', verifyToken, authorize(ACCESS_LEVELS.MANAGE_FINANCE), financeController.getTransactionAudits);

    return router;
};
