const { google } = require('googleapis');
const googleIntegrationRepository = require('../../repositories/user/googleIntegrationRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');

/**
 * GoogleAuthService
 * Handles OAuth2 client generation and token management for both doctor-specific and global integrations.
 */
class GoogleAuthService {
    constructor() {
        this.SCOPES = [
            'https://www.googleapis.com/auth/calendar'
        ];
    }

    /**
     * Get an authorized OAuth2 client
     */
    getOAuthClient() {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback';

        if (!clientId || !clientSecret) {
            throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env");
        }

        return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    }

    /**
     * Get tokens (refresh, access, expiry) for a doctor or global
     */
    async getTokens(doctorId) {
        let tokens = {};
        if (doctorId) {
            const row = await googleIntegrationRepository.findTokensByDoctorId(doctorId);
            if (row) {
                tokens = {
                    google_refresh_token: row.refresh_token,
                    google_access_token: row.access_token,
                    google_token_expiry: row.token_expiry
                };
            }
        } else {
            const rows = await systemSettingsRepository.findManyByKeys(['google_refresh_token', 'google_access_token', 'google_token_expiry']);
            if (rows && rows.length > 0) {
                rows.forEach(r => tokens[r.setting_key] = r.setting_value);
            }
        }
        return tokens;
    }

    /**
     * Get an authorized client instance for a specific doctor or global
     */
    async getAuthorizedClient(doctorId) {
        const tokens = await this.getTokens(doctorId);

        if (!tokens.google_refresh_token) {
            return null;
        }

        const oauth2Client = this.getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: tokens.google_refresh_token,
            access_token: tokens.google_access_token,
            expiry_date: parseInt(tokens.google_token_expiry)
        });

        return oauth2Client;
    }

    /**
     * Save tokens after OAuth callback
     */
    async saveTokens(tokens, doctorId) {
        const expiry = tokens.expiry_date || (Date.now() + 3500 * 1000);

        if (doctorId) {
            await googleIntegrationRepository.upsertTokens(doctorId, {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                token_expiry: expiry
            });
        } else {
            if (tokens.refresh_token) {
                await systemSettingsRepository.upsert('google_refresh_token', tokens.refresh_token);
            }
            if (tokens.access_token) {
                await systemSettingsRepository.upsert('google_access_token', tokens.access_token);
            }
            if (tokens.expiry_date) {
                await systemSettingsRepository.upsert('google_token_expiry', tokens.expiry_date.toString());
            }
        }
    }
}

module.exports = new GoogleAuthService();
