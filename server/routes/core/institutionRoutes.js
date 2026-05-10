const express = require('express');
const router = express.Router();
const institutionController = require('../../controllers/core/institutionController');
const { verifyToken } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorize');
const { ACCESS_LEVELS } = require('../../constants/roles');

router.get('/', verifyToken, institutionController.getAllInstitutions);
router.post('/', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), institutionController.createInstitution);
router.get('/:id/finances', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), institutionController.getFinances);
router.get('/:id/patients', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), institutionController.getPatientList);
router.put('/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), institutionController.updateInstitution);
router.delete('/:id', verifyToken, authorize(ACCESS_LEVELS.SYSTEM_ADMIN), institutionController.deleteInstitution);

module.exports = router;
