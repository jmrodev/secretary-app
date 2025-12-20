const express = require('express');
const router = express.Router();
const medicalController = require('../controllers/medicalController');
const { verifyToken } = require('../middleware/authMiddleware');
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

router.post('/prescriptions', verifyToken, medicalController.createPrescription);
router.get('/prescriptions', verifyToken, medicalController.getPrescriptions);

router.post('/licenses', verifyToken, medicalController.createLicense);
router.get('/licenses', verifyToken, medicalController.getLicenses);

// Requests
router.post('/requests', verifyToken, medicalController.createRequest);
router.get('/requests', verifyToken, medicalController.getRequests);
router.patch('/requests/:id', verifyToken, medicalController.updateRequestStatus);
router.patch('/requests/:id/payment', verifyToken, medicalController.updateRequestPaymentStatus);

// Files
router.post('/files', verifyToken, upload.single('file'), medicalController.uploadFile);
router.get('/files', verifyToken, medicalController.getPatientFiles);

module.exports = router;
