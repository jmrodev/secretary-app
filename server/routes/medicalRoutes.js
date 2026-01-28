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
        // Sanitize original filename (remove spaces and special chars, keep alphanumeric plus dots and dashes)
        const sanitized = file.originalname.replace(/[^a-z0-9.-]/gi, '_');
        cb(null, Date.now() + "_" + sanitized);
    }
});
const upload = multer({ storage: storage });

router.post('/prescriptions', verifyToken, medicalController.createPrescription);
router.get('/prescriptions', verifyToken, medicalController.getPrescriptions);
router.put('/prescriptions/:id', verifyToken, medicalController.updatePrescription);

router.post('/licenses', verifyToken, medicalController.createLicense);
router.get('/licenses', verifyToken, medicalController.getLicenses);
router.put('/licenses/:id', verifyToken, medicalController.updateLicense);

router.delete('/prescriptions/:id', verifyToken, medicalController.deletePrescription);
router.delete('/licenses/:id', verifyToken, medicalController.deleteLicense);

// Requests
router.post('/requests', verifyToken, medicalController.createRequest);
router.get('/requests', verifyToken, medicalController.getRequests);
router.patch('/requests/:id', verifyToken, medicalController.updateRequestStatus);
router.put('/requests/:id', verifyToken, medicalController.updateRequest);
router.patch('/requests/:id/payment', verifyToken, medicalController.updateRequestPaymentStatus);
router.delete('/requests/:id', verifyToken, medicalController.deleteRequest);
router.delete('/files/:id', verifyToken, medicalController.deleteFile);

// Vademecum & Patient Medications
router.get('/vademecum/search', verifyToken, medicalController.searchVademecum);
router.get('/patients/:patientId/medications', verifyToken, medicalController.getPatientMedications);
router.post('/patients/medications', verifyToken, medicalController.addPatientMedication);
router.put('/patients/medications/:id', verifyToken, medicalController.updatePatientMedication);
router.delete('/patients/medications/:id', verifyToken, medicalController.deletePatientMedication);

// Files
router.post('/files', verifyToken, upload.single('file'), medicalController.uploadFile);
router.get('/files', verifyToken, medicalController.getPatientFiles);
router.get('/prescriptions/export/json', verifyToken, medicalController.exportPrescriptionsJSON);


// Prescription Requests (Public & Protected)
router.post('/prescription-request/generate', verifyToken, medicalController.generatePrescriptionRequestToken);
router.get('/public/prescription-request/:token', medicalController.getPublicPrescriptionRequestData);
router.post('/public/prescription-request/:token', medicalController.submitPublicPrescriptionRequest);
router.get('/public/vademecum/search', medicalController.searchVademecum);

module.exports = router;
