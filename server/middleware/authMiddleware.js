const jwt = require('jsonwebtoken');

const { pool } = require('../db');

const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).send('A token is required for authentication');
    }

    try {
        const bearer = token.split(' ');
        const bearerToken = bearer[1];

        if (!bearerToken) {
            return res.status(403).send('Invalid token format');
        }

        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
        req.user = decoded;

        // Check if token_version is still valid
        // We need to fetch the current version from the DB
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT token_version FROM users WHERE id = ?", [decoded.user_id]);
        conn.release();

        if (rows.length === 0) {
            return res.status(404).send("User not found");
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
        console.error("Auth Middleware Error:", err);
        return res.status(401).send('Invalid Token');
    }
    return next();
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied. Admin only.');
    }
    next();
};

const isSecretary = (req, res, next) => {
    if (req.user.role !== 'secretary' && req.user.role !== 'admin') {
        return res.status(403).send('Access denied. Secretary or Admin only.');
    }
    next();
};

module.exports = { verifyToken, isAdmin, isSecretary };
