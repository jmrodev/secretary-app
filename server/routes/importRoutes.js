const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const importController = require('../controllers/importController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

router.post('/csv', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), upload.single('file'), importController.importCsv);

module.exports = router;
