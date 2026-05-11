const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/system/settingsController');
// const { verifyToken, verifyAdmin } = require('../../middleware/authMiddleware'); 
// For now, let's allow authenticated users to read, but maybe restrict write.
// Since 'System Config' is generally an admin/secretary page, we'll rely on frontend specific checks + standard auth.

const { verifyToken } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorize');
const { ACCESS_LEVELS } = require('../../constants/roles');

router.get('/', verifyToken, settingsController.getSettings);
router.post('/', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), settingsController.updateSetting);
router.post('/refresh-tunnel', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), settingsController.refreshTunnel);

module.exports = router;
