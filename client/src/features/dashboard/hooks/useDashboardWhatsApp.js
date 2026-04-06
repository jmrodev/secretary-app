import { copyToClipboard } from '../../../utils/clipboardUtils';

export const useDashboardWhatsApp = ({ user, settings, showMessage }) => {

    const handleWhatsApp = (appt, type) => {
        let phone = appt.patient_phone;
        if (!phone) {
            const phoneMatch = appt.reason?.match(/\d{9,13}/);
            if (phoneMatch) {
                phone = phoneMatch[0];
            } else {
                showMessage("No phone number available. Please adjust/sync the appointment first.", "error");
                return;
            }
        }

        const dateStr = new Date(appt.appointment_date).toLocaleDateString();
        const timeStr = new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        let message = '';

        if (type === 'reminder') {
            let messageTemplate = settings.appointment_reminder_template;
            if (!messageTemplate || !messageTemplate.trim()) {
                messageTemplate = `Hola {patient_name}, te escribimos para confirmar tu turno del día {date} a las {time} con el/la Dr/a. {doctor_name}. Por favor confirma asistencia. Gracias!`;
            }
            message = messageTemplate
                .replace(/{patient_name}/g, appt.patient_name || appt.reason)
                .replace(/{date}/g, dateStr)
                .replace(/{time}/g, timeStr)
                .replace(/{doctor_name}/g, appt.doctor_name)
                .replace(/{secretary_name}/g, user?.name || 'Secretaria');
        } else {
            message = `Hola {patient_name}, tu turno ha sido confirmado para el {date} a las {time}. Gracias por confiar en nosotros!`
                .replace(/{patient_name}/g, appt.patient_name)
                .replace(/{date}/g, dateStr)
                .replace(/{time}/g, timeStr);
        }

        copyToClipboard(message).then(() => {
            showMessage("Texto copiado! Abriendo WhatsApp...", "success");
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
            showMessage("Error al copiar texto", "error");
        });
    };

    return {
        handleWhatsApp
    };
};
