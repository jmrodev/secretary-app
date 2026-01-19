const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ROLES, ACCESS_LEVELS } = require('../constants/roles');

router.get('/', verifyToken, institutionController.getAllInstitutions);
router.post('/', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), institutionController.createInstitution);
router.get('/:id/finances', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), institutionController.getInstitutionFinances); // [NEW] Report
router.put('/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), institutionController.updateInstitution);
router.delete('/:id', verifyToken, authorize(ACCESS_LEVELS.SYSTEM_ADMIN), institutionController.deleteInstitution);

module.exports = router;
