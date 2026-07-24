const express = require('express');
const router = express.Router();
const scheduleController = require('../../controllers/scheduling/scheduleController');
const { verifyToken } = require('../../middleware/authMiddleware');
router.get('/:doctorId', verifyToken, scheduleController.getSchedule);
router.put('/:doctorId', verifyToken, scheduleController.updateSchedule);

module.exports = router;
