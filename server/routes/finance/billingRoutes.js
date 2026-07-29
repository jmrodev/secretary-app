const express = require('express');
const router = express.Router();
const billingController = require('../../controllers/finance/billingController');
const { verifyToken } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorize');
const { ACCESS_LEVELS } = require('../../constants/roles');

const upload = require('../../middleware/uploadMiddleware');

router.get('/status', verifyToken, billingController.getServerStatus);
router.post('/csr', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), billingController.generateCsr);
router.post('/upload-cert', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), upload.single('cert'), billingController.uploadCert);
router.post('/invoice', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), billingController.createInvoice);

module.exports = router;
