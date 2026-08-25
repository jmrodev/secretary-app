const authService = require('../../services/user/authService');

/**
 * register
 * Delegating registration logic to AuthService.
 */
exports.register = async (req, res) => {
    try {
        // Build a clean copy instead of mutating req.body (full_name fallback)
        const body = {
            ...req.body,
            fullName: req.body.fullName || req.body.full_name
        };

        const result = await authService.register(req, body);
        res.status(201).json(result);
    } catch (err) {
        console.error("Register Error:", err);
        if (err.statusCode) return res.status(err.statusCode).send(err.message);
        res.status(err.message === 'User already exists' ? 409 : 400).send(err.message);
    }
};

exports.publicRegister = async (req, res) => {
    try {
        const result = await authService.publicRegister(req, req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error("Public Register Error:", err);
        if (err.statusCode) return res.status(err.statusCode).send(err.message);
        res.status(err.message === 'User already exists' ? 409 : 400).send(err.message);
    }
};

/**
 * login
 * Delegating login logic to AuthService.
 */
exports.login = async (req, res) => {
    try {
        const result = await authService.login(req, req.body);
        res.status(200).json(result);
    } catch (err) {
        console.error("Login Error:", err);
        res.status(err.message === 'Invalid Credentials' ? 400 : 500).send(err.message);
    }
};

/**
 * verify
 * Simply returns the user data already attached by the authMiddleware.
 */
exports.verify = async (req, res) => {
    res.status(200).json(req.user);
};
