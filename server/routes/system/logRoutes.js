const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorize');
const { ACCESS_LEVELS } = require('../../constants/roles');
const auditRepository = require('../../repositories/system/auditRepository');
const restoreController = require('../../controllers/system/restoreController');

// Get logs (Admin only)
router.get('/', verifyToken, authorize(ACCESS_LEVELS.SYSTEM_ADMIN), async (req, res) => {
    try {
        const rows = await auditRepository.findRecentLogs(100);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Get recycle bin (Admin/Secretary)
router.get('/recycle-bin', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), async (req, res) => {
    try {
        const rows = await auditRepository.findRecycleBin();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post('/restore/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), restoreController.restoreItem);

module.exports = router;
