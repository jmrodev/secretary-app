const axios = require('axios');
const systemSettingsRepository = require('../repositories/systemSettingsRepository');

const getMetaCredentials = async () => {
    const rows = await systemSettingsRepository.findManyByKeys(['meta_phone_number_id', 'meta_access_token']);
    const settings = {};
    rows.forEach(r => settings[r.setting_key] = r.setting_value);
    return settings;
};

/**
 * Send a template message using WhatsApp Cloud API
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} templateName - Name of the template in Meta
 * @param {string} languageCode - Language code (e.g. 'es_AR' or 'es')
 * @param {Array} components - Template variable components
 */
const sendTemplateMessage = async (to, templateName, languageCode = 'es', components = []) => {
    const { meta_phone_number_id, meta_access_token } = await getMetaCredentials();

    if (!meta_phone_number_id || !meta_access_token) {
        throw new Error('Meta WhatsApp credentials not found in system settings.');
    }

    const url = `https://graph.facebook.com/v21.0/${meta_phone_number_id}/messages`;

    const messageData = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: languageCode
            },
            components: components
        }
    };

    try {
        const response = await axios.post(url, messageData, {
            headers: {
                'Authorization': `Bearer ${meta_access_token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('WhatsApp API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send WhatsApp message');
    }
};

/**
 * Send a generic test message to verify connection
 */
const sendTestMessage = async (to) => {
    // Usually 'hello_world' is a standard template in all Meta Apps
    return sendTemplateMessage(to, 'hello_world', 'en_US');
};

module.exports = {
    sendTemplateMessage,
    sendTestMessage
};
