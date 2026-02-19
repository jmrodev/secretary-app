const temporaryAccessService = require('../services/temporaryAccessService');

/**
 * generateToken
 * Delegating token generation logic to TemporaryAccessService.
 */
exports.generateToken = async (req, res) => {
    try {
        const result = await temporaryAccessService.generateToken(req.body.patientId);
        res.json(result);
    } catch (error) {
        console.error("Error generating token:", error);
        res.status(error.message === 'Patient not found' ? 404 : 500).json({ error: error.message });
    }
};

/**
 * verifyToken
 * Delegating token verification logic to TemporaryAccessService.
 */
exports.verifyToken = async (req, res) => {
    try {
        const result = await temporaryAccessService.verifyToken(req.params.token);
        res.json(result);
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(404).json({ message: error.message });
    }
};

/**
 * completeProfile
 * Delegating profile completion logic to TemporaryAccessService.
 */
exports.completeProfile = async (req, res) => {
    try {
        const result = await temporaryAccessService.completeProfile(req.params.token, req.body);
        res.json(result);
    } catch (error) {
        console.error("Error completing profile:", error);
        res.status(error.message === "Username already taken" ? 400 : 500).json({ error: error.message });
    }
};
