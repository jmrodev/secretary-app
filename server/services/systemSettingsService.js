const systemSettingsRepository = require('../repositories/systemSettingsRepository');
// Remote access service has been deprecated/removed
// const { refreshRemoteAccess, initRemoteAccess } = require('../utils/remoteAccessService');

/**
 * SystemSettingsService
 * Business logic for system settings, including security masking.
 */
class SystemSettingsService {
    async getPublicSettings() {
        const rows = await systemSettingsRepository.findAll();
        const settings = {};

        const whitelisted = [
            'google_sync_enabled', 'remote_access_method', 'duckdns_domain',
            'enable_office_rentals', 'staff_base_url', 'public_base_url',
            'pharmacy_email', 'pharmacy_phone'
        ];

        const sensitive = ['google_refresh_token', 'meta_access_token', 'duckdns_token'];

        rows.forEach(r => {
            const key = r.setting_key;
            const val = r.setting_value;

            if (whitelisted.includes(key)) {
                settings[key] = val;
            } else if (sensitive.includes(key)) {
                if (val && val.length > 0) settings[key] = "MASKED_PRESENT";
            } else if (!key.startsWith('google_') && !key.startsWith('meta_') && !key.startsWith('duckdns_')) {
                settings[key] = val;
            }
        });
        return settings;
    }

    async updateSetting(key, value) {
        await systemSettingsRepository.upsert(key, value);

        // Side effects
        if (key === 'remote_access_method') {
            console.log('Remote access method changed (remoteAccessService deprecated).');
            // initRemoteAccess();
        }

        if (key === 'enable_office_rentals' && String(value) === 'false') {
            await systemSettingsRepository.updateDoctorRentalLogic();
        }
    }

    refreshTunnel() {
        console.log('refreshTunnel logic called but remoteAccessService is deprecated.');
        // refreshRemoteAccess();
    }
}

module.exports = new SystemSettingsService();
