const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// POST /api/whatsapp/broadcast
router.post('/broadcast', whatsappController.broadcastMessage);

module.exports = router;
