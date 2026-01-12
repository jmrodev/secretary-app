const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const importController = require('../controllers/importController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/csv', verifyToken, upload.single('file'), importController.importCsv);

module.exports = router;
