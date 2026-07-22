const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/authMiddleware');
const multer = require('multer');

// New Controllers
const medicationController = require('../../controllers/medical/medicationController');
const prescriptionController = require('../../controllers/medical/prescriptionController');
const medicalRequestController = require('../../controllers/medical/medicalRequestController');
const licenseController = require('../../controllers/medical/licenseController');
const medicalFileController = require('../../controllers/medical/medicalFileController');
const medicalExportController = require('../../controllers/medical/medicalExportController');
const publicMedicalController = require('../../controllers/medical/publicMedicalController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const sanitized = file.originalname.replace(/[^a-z0-9.-]/gi, '_');
        cb(null, Date.now() + "_" + sanitized);
    }
});
const upload = multer({ storage: storage });

// Prescriptions
router.post('/prescriptions', verifyToken, prescriptionController.createPrescription);
router.get('/prescriptions/patient/:patientId', verifyToken, prescriptionController.getPrescriptions);
router.get('/prescriptions', verifyToken, prescriptionController.getPrescriptions);
router.put('/prescriptions/:id', verifyToken, prescriptionController.updatePrescription);
router.delete('/prescriptions/:id', verifyToken, prescriptionController.deletePrescription);

// Licenses
router.post('/licenses', verifyToken, licenseController.createLicense);
router.get('/licenses/patient/:patientId', verifyToken, licenseController.getLicenses);
router.get('/licenses', verifyToken, licenseController.getLicenses);
router.put('/licenses/:id', verifyToken, licenseController.updateLicense);
router.delete('/licenses/:id', verifyToken, licenseController.deleteLicense);

// Requests
router.post('/requests', verifyToken, medicalRequestController.createRequest);
router.get('/requests/patient/:patientId', verifyToken, medicalRequestController.getRequests);
router.get('/requests', verifyToken, medicalRequestController.getRequests);
router.patch('/requests/:id', verifyToken, medicalRequestController.updateRequestStatus);
router.put('/requests/:id', verifyToken, medicalRequestController.updateRequest);
router.patch('/requests/:id/payment', verifyToken, medicalRequestController.updateRequestPaymentStatus);
router.delete('/requests/:id', verifyToken, medicalRequestController.deleteRequest);

// Vademecum & Patient Medications
router.get('/vademecum/search', verifyToken, medicationController.searchVademecum);
router.get('/patients/:patientId/medications', verifyToken, medicationController.getPatientMedications);
router.post('/patients/medications', verifyToken, medicationController.addPatientMedication);
router.put('/patients/medications/:id', verifyToken, medicationController.updatePatientMedication);
router.delete('/patients/medications/:id', verifyToken, medicationController.deletePatientMedication);

// Files
router.post('/files', verifyToken, upload.single('file'), medicalFileController.uploadFile);
router.get('/files/patient/:patientId', verifyToken, medicalFileController.getPatientFiles);
router.get('/files', verifyToken, medicalFileController.getPatientFiles);
router.delete('/files/:id', verifyToken, medicalFileController.deleteFile);

// Exports
router.get('/prescriptions/export/json', verifyToken, medicalExportController.exportPrescriptionsJSON);
router.get('/licenses/export/json', verifyToken, medicalExportController.exportLicensesJSON);
router.get('/certificates/export/json', verifyToken, medicalExportController.exportCertificatesJSON);

// Public Routes (Prescription Requests)
router.post('/prescription-request/generate', verifyToken, publicMedicalController.generatePrescriptionRequestToken);
router.get('/public/prescription-request/:token', publicMedicalController.getPublicPrescriptionRequestData);
router.post('/public/prescription-request/:token', publicMedicalController.submitPublicPrescriptionRequest);
router.get('/public/vademecum/search', medicationController.searchVademecum);

module.exports = router;
