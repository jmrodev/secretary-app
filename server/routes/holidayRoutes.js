const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, holidayController.getHolidays);
router.post('/', protect, holidayController.addHoliday);
router.delete('/:id', protect, holidayController.deleteHoliday);

module.exports = router;
