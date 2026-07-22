const authService = require('../../services/user/authService');

const resolveAuthError = (message, type) => {
    if (message === 'User already exists') {
        return { status: 409, error: 'User already exists' };
    }
    if (type === 'login' && message === 'Invalid Credentials') {
        return { status: 400, error: 'Invalid Credentials' };
    }
    return { status: type === 'login' ? 500 : 400, error: type === 'login' ? 'Internal Server Error' : 'Invalid request data' };
};

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
        const { status, error } = resolveAuthError(err.message, 'register');
        res.status(status).send(error);
    }
};

exports.publicRegister = async (req, res) => {
    try {
        const result = await authService.publicRegister(req, req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error("Public Register Error:", err);
        const { status, error } = resolveAuthError(err.message, 'publicRegister');
        res.status(status).send(error);
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
        const { status, error } = resolveAuthError(err.message, 'login');
        res.status(status).send(error);
    }
};

/**
 * verify
 * Simply returns the user data already attached by the authMiddleware.
 */
exports.verify = async (req, res) => {
    res.status(200).json(req.user);
};
