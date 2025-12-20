const express = require('express');
const router = express.Router();
const consultorioController = require('../controllers/consultorioController');
const { verifyToken, isAdmin, isSecretary } = require('../middleware/authMiddleware');

// Public/Shared
router.get('/', verifyToken, consultorioController.getAllConsultorios);

// Admin/Secretary only
router.post('/', verifyToken, isSecretary, consultorioController.createConsultorio);

// Doctor rentals
router.post('/rent', verifyToken, consultorioController.createRental);
router.get('/my-rentals', verifyToken, consultorioController.getMyRentals);

module.exports = router;
