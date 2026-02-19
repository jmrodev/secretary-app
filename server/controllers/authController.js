const authService = require('../services/authService');

/**
 * register
 * Delegating registration logic to AuthService.
 */
exports.register = async (req, res) => {
    try {
        // Handle full_name fallback
        if (!req.body.fullName && req.body.full_name) {
            req.body.fullName = req.body.full_name;
        }

        const result = await authService.register(req, req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error("Register Error:", err);
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
