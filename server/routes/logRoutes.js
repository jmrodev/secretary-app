const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { ROLES, ACCESS_LEVELS } = require('../constants/roles');

// Get logs (Admin only)
router.get('/', verifyToken, authorize(ACCESS_LEVELS.SYSTEM_ADMIN), async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
});

// Get recycle bin (Admin/Secretary)
router.get('/recycle-bin', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM recycle_bin ORDER BY deleted_at DESC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
});

const restoreController = require('../controllers/restoreController');
router.post('/restore/:id', verifyToken, authorize(ACCESS_LEVELS.MANAGE_CORE_DATA), restoreController.restoreItem);

module.exports = router;
