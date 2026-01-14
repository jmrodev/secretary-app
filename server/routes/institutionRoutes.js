const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const { verifyToken, isAdmin, isSecretary } = require('../middleware/authMiddleware');

router.get('/', verifyToken, institutionController.getAllInstitutions);
router.post('/', verifyToken, isSecretary, institutionController.createInstitution);
router.get('/:id/finances', verifyToken, isSecretary, institutionController.getInstitutionFinances); // [NEW] Report
router.put('/:id', verifyToken, isSecretary, institutionController.updateInstitution);
router.delete('/:id', verifyToken, isAdmin, institutionController.deleteInstitution);

module.exports = router;
