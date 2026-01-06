const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, holidayController.getHolidays);
router.post('/', verifyToken, holidayController.addHoliday);
router.delete('/:id', verifyToken, holidayController.deleteHoliday);

module.exports = router;
