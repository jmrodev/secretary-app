const axios = require('axios');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const whatsappRepository = require('../../repositories/communication/whatsappRepository');
const { formatDateDisplay, formatTimeDisplay } = require('../../utils/core/dateUtils');

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
        throw new Error(error.response?.data?.error?.message || 'Failed to send WhatsApp message', { cause: error });
    }
};

const normalizePhoneForWhatsapp = (phone) => {
    if (!phone) return phone;
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.startsWith('549')) {
        cleaned = '54' + cleaned.slice(3);
    }
    return cleaned;
};

/**
 * Send a direct text message using the local WhatsApp Bridge (MCP/Go)
 * @param {string} to - Recipient phone number
 * @param {string} message - Plain text message
 */
const sendMessageDirect = async (to, message, patientId = null) => {
    const formattedRecipient = normalizePhoneForWhatsapp(to);
    const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'http://127.0.0.1:8090/api/send';
    
    try {
        console.log(`[WhatsApp Bridge] Sending to: ${formattedRecipient} (original: ${to}), URL: ${bridgeUrl}`);
        const response = await axios.post(bridgeUrl, {
            recipient: formattedRecipient,
            message: message
        });
        
        if (patientId) {
            await whatsappRepository.createMessage(patientId, 'outbound', message, null, 'sent');
        } else {
            await whatsappRepository.createMessage(null, 'outbound', message, null, 'sent', to);
        }

        console.log(`[WhatsApp Bridge] Response:`, response.data);
        return response.data;
    } catch (error) {
        console.error('Local WhatsApp Bridge Error:', error.response?.data || error.message);
        
        // Save failed message to history for UI feedback
        try {
            if (patientId) {
                await whatsappRepository.createMessage(patientId, 'outbound', message, null, 'failed');
            } else {
                await whatsappRepository.createMessage(null, 'outbound', message, null, 'failed', to);
            }
        } catch (dbErr) {
            console.error('[WhatsApp Service] Error saving failed message:', dbErr);
        }

        const detailMsg = error.response?.data || error.message || 'WhatsApp Bridge error';
        throw new Error(`No se pudo enviar el mensaje por WhatsApp: ${detailMsg}`);
    }
};

/**
 * Automated task to send reminders for tomorrow's appointments
 */
const sendAutomatedReminders = async () => {
    try {
        const isEnabled = await systemSettingsRepository.findByKey('whatsapp_use_local_bridge');
        if (!isEnabled || isEnabled.setting_value !== 'true') {
            console.log('[WhatsApp] Automated reminders skipped (bridge not enabled in settings)');
            return;
        }

        const appointments = await appointmentRepository.findTomorrowAppointments();
        if (appointments.length === 0) {
            console.log('[WhatsApp] No appointments for tomorrow to remind.');
            return;
        }

        console.log(`[WhatsApp] Sending ${appointments.length} automated reminders...`);

        // Fetch global settings for templates
        const settingsRows = await systemSettingsRepository.findAll();
        const settings = {};
        settingsRows.forEach(r => settings[r.setting_key] = r.setting_value);

        for (const appt of appointments) {
            try {
                let template = settings.whatsapp_template_reminder;

                if (!template?.trim()) {
                    throw new Error('Template missing or empty');
                }

                const dateStr = formatDateDisplay(appt.appointment_date);
                const timeStr = formatTimeDisplay(appt.appointment_date);
                const address = settings.clinic_address || '';

                const isVirtual = appt.type === 'virtual';
                const message = template
                    .replace(/{patient_name}/g, appt.patient_name)
                    .replace(/{date}/g, dateStr)
                    .replace(/{time}/g, timeStr)
                    .replace(/{doctor_name}/g, appt.doctor_name)
                    .replace(/{appointment_location}/g, isVirtual ? 'Virtual' : address)
                    .replace(/{appointment_type}/g, isVirtual ? 'VIRTUAL' : 'PRESENCIAL');

                let phone = appt.patient_phone.replace(/\D/g, '');
                if (!phone.startsWith('54') && phone.length >= 10) phone = '549' + phone;

                await sendMessageDirect(phone, message, appt.patient_id);
                console.log(`[WhatsApp Bridge] Automated reminder sent to ${phone} (${appt.patient_name})`);
            } catch (err) {
                if (err.message === 'Template missing or empty') throw err;
                console.error(`[WhatsApp] Failed to send automated reminder to ${appt.patient_name}:`, err.message);
            }
        }
    } catch (err) {
        if (err.message === 'Template missing or empty') throw err;
        console.error('[WhatsApp] Error in sendAutomatedReminders task:', err);
    }
};

/**
 * Send a generic test message to verify connection
 */
const sendTestMessage = async (to) => {
    // Usually 'hello_world' is a standard template in all Meta Apps
    return sendTemplateMessage(to, 'hello_world', 'en_US');
};

/**
 * Get bridge status from Go service
 */
const getBridgeStatus = async () => {
    try {
        const bridgeUrl = process.env.WHATSAPP_BRIDGE_STATUS_URL || 'http://127.0.0.1:8090/api/status';
        const response = await axios.get(bridgeUrl, { timeout: 2000 });
        return response.data;
    } catch (_) {
        return { status: 'offline', qr_code: '' };
    }
};

/**
 * Logout from WhatsApp bridge (clears session, forces new QR)
 */
const logoutBridge = async () => {
    const bridgeBase = (process.env.WHATSAPP_BRIDGE_STATUS_URL || 'http://127.0.0.1:8090/api/status').replace('/api/status', '');
    try {
        await axios.post(`${bridgeBase}/api/logout`, {}, { timeout: 3000 });
    } catch (error) {
        throw new Error('Could not reach WhatsApp bridge to logout.', { cause: error });
    }
};

/**
 * Send an immediate confirmation message for a newly booked appointment
 * @param {Object} data - Appointment details { patient_name, appointment_date, doctor_id, type, patient_phone, patient_id }
 */
const sendConfirmationMessage = async (appt) => {
    try {
        const isEnabled = await systemSettingsRepository.findByKey('whatsapp_use_local_bridge');
        if (!isEnabled || isEnabled.setting_value !== 'true') {
            return;
        }

        // Fetch global settings for templates
        const settingsRows = await systemSettingsRepository.findAll();
        const settings = {};
        settingsRows.forEach(r => settings[r.setting_key] = r.setting_value);

        let template = settings.whatsapp_template_confirmation;

        if (!template?.trim()) {
            throw new Error('Template missing or empty');
        }

        const dateStr = formatDateDisplay(appt.appointment_date);
        const timeStr = formatTimeDisplay(appt.appointment_date);
        const address = settings.clinic_address || '';

        // Get doctor name (we might need to fetch it if not provided)
        let doctorName = appt.doctor_name || 'Médico';
        if (!appt.doctor_name && appt.doctor_id) {
            const doctorRepository = require('../../repositories/user/doctorRepository');
            const doctor = await doctorRepository.findById(appt.doctor_id);
            if (doctor) doctorName = doctor.full_name || doctor.name;
        }

        const isVirtual = appt.type === 'virtual';
        const message = template
            .replace(/{patient_name}/g, appt.patient_name || 'Paciente')
            .replace(/{date}/g, dateStr)
            .replace(/{time}/g, timeStr)
            .replace(/{doctor_name}/g, doctorName)
            .replace(/{appointment_location}/g, isVirtual ? 'Virtual' : address)
            .replace(/{appointment_type}/g, isVirtual ? 'VIRTUAL' : 'PRESENCIAL');

        let phone = appt.patient_phone.replace(/\D/g, '');
        if (!phone.startsWith('54') && phone.length >= 10) phone = '549' + phone;

        await sendMessageDirect(phone, message, appt.patient_id);
        console.log(`[WhatsApp Bridge] Confirmation sent to ${phone} (${appt.patient_name})`);
    } catch (err) {
        if (err.message === 'Template missing or empty') throw err;
        console.error(`[WhatsApp] Failed to send confirmation to ${appt.patient_name}:`, err.message);
    }
};

/**
 * Send a debt reminder message to a patient
 */
const sendDebtReminder = async (data) => {
    try {
        const { patient_id, patient_name, debt_amount, patient_phone } = data;
        
        const isEnabled = await systemSettingsRepository.findByKey('whatsapp_use_local_bridge');
        if (!isEnabled || isEnabled.setting_value !== 'true') return;

        const templateSetting = await systemSettingsRepository.findByKey('whatsapp_template_debt');
        if (!templateSetting || !templateSetting.setting_value?.trim()) {
            throw new Error('Template missing or empty');
        }

        const message = templateSetting.setting_value
            .replace(/{patient_name}/g, patient_name || 'Paciente')
            .replace(/{debt_amount}/g, debt_amount);

        let phone = patient_phone.replace(/\D/g, '');
        if (!phone.startsWith('54') && phone.length >= 10) phone = '549' + phone;

        await sendMessageDirect(phone, message, patient_id);
        console.log(`[WhatsApp Bridge] Debt reminder sent to ${phone} (${patient_name})`);
    } catch (err) {
        console.error(`[WhatsApp] Failed to send debt reminder:`, err.message);
        throw err;
    }
};

const refreshBridge = async () => {
    const bridgeBase = (process.env.WHATSAPP_BRIDGE_STATUS_URL || 'http://127.0.0.1:8090/api/status').replace('/api/status', '');
    try {
        await axios.post(`${bridgeBase}/api/refresh`, {}, { timeout: 3000 });
    } catch (error) {
        throw new Error('Could not reach WhatsApp bridge to refresh.', { cause: error });
    }
};

module.exports = {
    sendTemplateMessage,
    sendTestMessage,
    sendMessageDirect,
    sendConfirmationMessage,
    sendAutomatedReminders,
    sendDebtReminder,
    getBridgeStatus,
    logoutBridge,
    refreshBridge
};
