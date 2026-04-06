const jwt = require('jsonwebtoken');

const { pool } = require('../db');

const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).send('A token is required for authentication');
    }

    try {
        const parts = token.trim().split(/\s+/);
        if (parts.length < 2 || parts[0].toLowerCase() !== 'bearer') {
            return res.status(403).send('Invalid token format (Example: Bearer <token>)');
        }

        const bearerToken = parts[1];

        if (!bearerToken || bearerToken.length < 10) {
            return res.status(403).send('Invalid token (token too short)');
        }

        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
        req.user = decoded;

        // Check if token_version is still valid
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT token_version FROM users WHERE id = ?", [decoded.user_id]);
        conn.release();

        if (rows.length === 0) {
            return res.status(401).send("User not found (Session invalid)");
        }

        const currentVersion = rows[0].token_version;
        // Handle backward compatibility: if token has no version (undefined), assume 0? 
        // Or if logic is new, we demand match.
        const tokenVersion = decoded.token_version || 0; // Treat undefined as 0

        if (tokenVersion !== currentVersion) {
            console.log(`Token Eviction: User ${decoded.username} used v${tokenVersion} but DB is v${currentVersion}`);
            return res.status(401).send('Session expired. Password has changed. Please login again.');
        }

    } catch (err) {
        console.error("Auth Middleware Error:", err.message);
        return res.status(401).send('Invalid Token');
    }
    return next();
};

module.exports = { verifyToken };
