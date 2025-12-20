const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Get logs (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        // Limit to last 100 for now, ordered by new
        const rows = await conn.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;
