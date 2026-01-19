const express = require('express');
const router = express.Router();
const consultorioController = require('../controllers/consultorioController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

// Public/Shared
router.get('/', verifyToken, consultorioController.getAllConsultorios);

// Admin/Secretary only
router.post('/', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), consultorioController.createConsultorio);

// Doctor rentals
router.post('/rent', verifyToken, consultorioController.createRental);
router.get('/my-rentals', verifyToken, consultorioController.getMyRentals);

module.exports = router;
