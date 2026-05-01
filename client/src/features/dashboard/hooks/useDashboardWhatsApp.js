import { copyToClipboard } from '@/utils/clipboardUtils';
import { replaceTemplateVariables } from '@/utils/stringUtils';
import { useLanguage } from '@/context/LanguageContext';
import { useMessage } from '@/context/MessageContext';
import api from '@/api/axios';

export const useDashboardWhatsApp = ({ user, settings, showMessage, t }) => {
    const handleWhatsApp = (appt, type) => {
        let phone = appt.patient_phone;
        if (!phone) {
            const phoneMatch = appt.reason?.match(/\d{9,13}/);
            if (phoneMatch) {
                phone = phoneMatch[0];
            } else {
                showMessage(t('no_phone_available_sync_first'), 'error');
                return;
            }
        }

        const dateStr = new Date(appt.appointment_date).toLocaleDateString();
        const timeStr = new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        let message = '';

        if (type === 'reminder') {
            let messageTemplate = settings.appointment_reminder_template;
            if (!messageTemplate || !messageTemplate.trim()) {
                messageTemplate = t('whatsapp_appointment_reminder_template');
            }
            message = replaceTemplateVariables(messageTemplate, {
                patient_name: appt.patient_name || appt.reason,
                date: dateStr,
                time: timeStr,
                doctor_name: appt.doctor_name,
                secretary_name: user?.full_name || user?.name || t('secretary')
            });
        } else {
            message = replaceTemplateVariables(t('whatsapp_appointment_confirmed_template'), {
                patient_name: appt.patient_name,
                date: dateStr,
                time: timeStr
            });
        }

        const cleanPhone = phone.replace(/\D/g, '');
        let normalizedPhone = cleanPhone;
        if (!normalizedPhone.startsWith('54') && normalizedPhone.length >= 10) normalizedPhone = '549' + normalizedPhone;

        const sendDirect = async () => {
            try {
                showMessage(t('sending_whatsapp') || 'Enviando WhatsApp...', 'info');
                await api.post('/whatsapp/send-direct', {
                    to: normalizedPhone,
                    message: message
                });
                showMessage(t('whatsapp_sent') || 'Mensaje enviado!', 'success');
            } catch (err) {
                console.error("Direct send failed, falling back to manual", err);
                
                copyToClipboard(message).then(() => {
                    showMessage(t('whatsapp_text_copied_opening'), 'success');
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                    if (isMobile) {
                        const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
                        window.open(url, '_blank');
                    } else {
                        const appUrl = `whatsapp://send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`;
                        const webUrl = `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`;
                        window.location.href = appUrl;
                        setTimeout(() => window.open(webUrl, '_blank'), 2500);
                    }
                });
            }
        };

        sendDirect();
    };

    return {
        handleWhatsApp
    };
};
