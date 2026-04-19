import { copyToClipboard } from '@/utils/clipboardUtils';
import { replaceTemplateVariables } from '@/utils/stringUtils';

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

        copyToClipboard(message).then(() => {
            showMessage(t('whatsapp_text_copied_opening'), 'success');
            phone = phone.replace(/\D/g, '');
            if (!phone.startsWith('54') && phone.length >= 10) {
                phone = '549' + phone;
            }
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
            } else {
                const appUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
                const webUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
                window.location.href = appUrl;
                setTimeout(() => window.open(webUrl, '_blank'), 2500);
            }
        }).catch(err => {
            console.error(err);
            showMessage(t('error_copying_text'), 'error');
        });
    };

    return {
        handleWhatsApp
    };
};
