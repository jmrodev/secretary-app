import { useMessage } from '../context/MessageContext';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { copyToClipboard } from '../utils/clipboardUtils';
import api from '../api/axios';

export const useWhatsAppUniversal = (doctors) => {
    const { showMessage } = useMessage();
    const { settings } = useConfig();
    const { user } = useAuth();

    const handleMetaSend = async (phone, templateName, paramsOrder, contextData) => {
        try {
            const paramKeys = paramsOrder.split(',').map(s => s.trim());
            const components = [{
                type: 'body',
                parameters: paramKeys.map(key => {
                    const rawKey = key.replace('{', '').replace('}', '');
                    let textVal = contextData[rawKey] || '';
                    return { type: 'text', text: String(textVal) };
                })
            }];

            showMessage('Enviando mensaje por WhatsApp API...', 'info');
            await api.post('/whatsapp/send', {
                to: phone,
                templateName: templateName,
                languageCode: 'es',
                components: components
            });
            showMessage('Mensaje enviado por API correctamente', 'success');
            return true;
        } catch (err) {
            console.error("Meta API Send Error:", err);
            showMessage(err.response?.data?.error || 'Error enviando por Meta API', 'error');
            return false;
        }
    };

    const handleWhatsAppUniversal = async (appt, type = 'reminder') => {
        let phone = appt.patient_phone;
        if (!phone) {
            const phoneMatch = appt.reason?.match(/\d{9,13}/);
            if (phoneMatch) phone = phoneMatch[0];
            else {
                showMessage("No phone number available.", "error");
                return;
            }
        }

        if (type === 'reminder') {
            const metaTemplateName = settings.meta_reminder_template_name;
            const metaParamsOrder = settings.meta_reminder_params_order;

            if (settings.meta_phone_number_id && metaTemplateName && metaParamsOrder) {
                const dateStr = new Date(appt.appointment_date).toLocaleDateString();
                const timeStr = new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const isVirtual = appt.type === 'virtual';

                const doctor = doctors.find(d => d.id === Number(appt.doctor_id));
                const doctorName = doctor?.full_name || 'Doctor';
                const consultationPrice = isVirtual ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0);
                const address = isVirtual ? 'Virtual (Cima Salud)' : (settings.clinic_address || 'Montiel 1255');

                const context = {
                    patient_name: appt.patient_name,
                    date: dateStr,
                    time: timeStr,
                    doctor_name: doctorName,
                    appointment_type: isVirtual ? 'VIRTUAL' : 'PRESENCIAL',
                    appointment_location: address,
                    price: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(consultationPrice),
                    secretary_name: user.name || 'Secretaría',
                    cbu: doctor?.cbu || '',
                    alias: doctor?.alias || '',
                    bio: doctor?.bio || ''
                };

                if (await handleMetaSend(phone, metaTemplateName, metaParamsOrder, context)) {
                    return;
                }
            }
        }

        const dateStr = new Date(appt.appointment_date).toLocaleDateString();
        const timeStr = new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const doctor = doctors.find(d => Number(d.id) === Number(appt.doctor_id));
        const isVirtual = appt.type === 'virtual';

        let messageTemplate = '';
        if (type === 'reminder') {
            const doctorTemplate = isVirtual ? doctor?.reminder_virtual_template : doctor?.reminder_template;
            messageTemplate = doctorTemplate || (isVirtual ? settings.appointment_reminder_virtual_template : settings.appointment_reminder_template);

            if (!messageTemplate?.trim()) {
                messageTemplate = isVirtual
                    ? `Hola {patient_name}, te recordamos tu turno VIRTUAL para el día {date} a las {time} con el/la Dr/a. {doctor_name}.`
                    : `Hola {patient_name}, te recordamos tu turno del día {date} a las {time} con el/la Dr/a. {doctor_name} en {appointment_location}. Por favor confirma asistencia.`;
            }
        } else {
            const doctorTemplate = isVirtual ? doctor?.confirmation_virtual_template : doctor?.confirmation_template;
            messageTemplate = doctorTemplate || (isVirtual ? settings.appointment_confirmation_virtual_template : settings.appointment_confirmation_template);

            if (!messageTemplate?.trim()) {
                messageTemplate = isVirtual
                    ? `Hola {patient_name}, te confirmamos tu turno VIRTUAL para el día {date} a las {time} con el/la Dr/a. {doctor_name}.`
                    : `Hola {patient_name}, te confirmamos tu turno del día {date} a las {time} con el/la Dr/a. {doctor_name} en {appointment_location}.`;
            }
        }

        const apptPrice = isVirtual ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0);
        const address = isVirtual ? 'Virtual (Cima Salud)' : (settings.clinic_address || 'Montiel 1255');

        const message = messageTemplate
            .replace(/{patient_name}/g, appt.patient_name || appt.reason)
            .replace(/{date}/g, dateStr)
            .replace(/{time}/g, timeStr)
            .replace(/{doctor_name}/g, appt.doctor_name)
            .replace(/{appointment_type}/g, isVirtual ? 'VIRTUAL' : 'PRESENCIAL')
            .replace(/{appointment_location}/g, address)
            .replace(/{price}/g, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(apptPrice))
            .replace(/{secretary_name}/g, user.name || 'Secretaria')
            .replace(/{cbu}/g, doctor?.cbu || '')
            .replace(/{alias}/g, doctor?.alias || '')
            .replace(/{bio}/g, doctor?.bio || '');

        try {
            await copyToClipboard(message);
            showMessage(`${type === 'reminder' ? 'Recordatorio' : 'Comprobante'} copiado! Abriendo WhatsApp...`, "success");

            phone = phone.replace(/\D/g, '');
            if (!phone.startsWith('54') && phone.length >= 10) phone = '549' + phone;

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            } else {
                const appUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
                const webUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

                // Priority ZapZap/Desktop App -> Web
                window.location.href = appUrl;

                // Fallback to Web if App doesn't open (simple timeout heuristic)
                setTimeout(() => window.open(webUrl, '_blank'), 2500);
            }
        } catch (err) {
            showMessage("Error al procesar WhatsApp", "error");
        }
    };

    return { handleWhatsAppUniversal };
};
