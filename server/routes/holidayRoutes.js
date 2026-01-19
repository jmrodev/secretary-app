const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

router.get('/', verifyToken, holidayController.getHolidays);
router.post('/', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), holidayController.addHoliday);
router.delete('/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), holidayController.deleteHoliday);

module.exports = router;
