const googleAuthService = require('../../services/google/GoogleAuthService');
const googleIntegrationRepository = require('../../repositories/user/googleIntegrationRepository');
const { logAction } = require('../../utils/system/audit');

/**
 * googleAuthController
 * Handles HTTP requests for Google OAuth2 flow and integration status.
 */

exports.getAuthUrl = (req, res) => {
    try {
        const oauth2Client = googleAuthService.getOAuthClient();
        const doctorId = req.query.doctorId;
        const state = doctorId ? JSON.stringify({ doctorId }) : undefined;

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: googleAuthService.SCOPES,
            prompt: 'select_account consent',
            state,
        });
        res.json({ url });
    } catch (err) {
        console.error("Auth URL Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.oauthCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
        const oauth2Client = googleAuthService.getOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        let doctorId = null;
        if (req.query.state) {
            try {
                const stateObj = JSON.parse(decodeURIComponent(req.query.state));
                doctorId = stateObj.doctorId;
            } catch (e) {
                console.error("Failed to parse state:", e);
            }
        }

        await googleAuthService.saveTokens(tokens, doctorId);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/config?status=success`);
    } catch (err) {
        console.error("Callback Error:", err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/config?status=error`);
    }
};

exports.getStatus = async (req, res) => {
    const doctorId = req.query.doctorId;
    try {
        let connected = false;
        if (doctorId) {
            connected = !!(await googleIntegrationRepository.findDoctorIntegration(doctorId));
        } else {
            connected = !!(await googleIntegrationRepository.findGlobalToken());
        }
        res.json({ connected });
    } catch (err) {
        console.error(err);
        res.status(500).json({ connected: false, error: err.message });
    }
};

exports.disconnect = async (req, res) => {
    const doctorId = req.body.doctorId;
    try {
        if (doctorId) {
            await googleIntegrationRepository.deleteDoctorIntegration(doctorId);
            await logAction(req, 'GOOGLE_DISCONNECT', `Disconnected Google Account for Doctor ${doctorId}`);
        } else {
            await googleIntegrationRepository.deleteGlobalTokens();
            await logAction(req, 'GOOGLE_DISCONNECT', 'Disconnected Global Google Account');
        }
        res.json({ message: "Disconnected" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
