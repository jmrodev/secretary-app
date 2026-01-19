const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ACCESS_LEVELS } = require('../constants/roles');

router.get('/:doctorId', verifyToken, scheduleController.getSchedule);
router.put('/:doctorId', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), scheduleController.updateSchedule);

module.exports = router;
