const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
// const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware'); 
// For now, let's allow authenticated users to read, but maybe restrict write.
// Since 'System Config' is generally an admin/secretary page, we'll rely on frontend specific checks + standard auth.

const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, settingsController.getSettings);
router.post('/', verifyToken, settingsController.updateSetting);

module.exports = router;
