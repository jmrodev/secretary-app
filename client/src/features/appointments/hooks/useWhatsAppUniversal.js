import { useMessage } from '@/context/MessageContext';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '../../auth';
import { copyToClipboard } from '@/utils/clipboardUtils';
import api from '@/api/axios';

/**
 * useWhatsAppUniversal (Handler Hook).
 * Logic for sending WhatsApp messages (Reminders/Confirmations) for appointments.
 */
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
            await api.post('/whatsapp/send', { to: phone, templateName, languageCode: 'es', components });
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
            else { showMessage("No phone number available.", "error"); return; }
        }

        if (type === 'reminder') {
            const metaTemplateName = settings.meta_reminder_template_name;
            const metaParamsOrder = settings.meta_reminder_params_order;

            if (settings.meta_phone_number_id && metaTemplateName && metaParamsOrder) {
                const doctor = doctors.find(d => d.id === Number(appt.doctor_id));
                const address = appt.type === 'virtual' ? 'Virtual (Cima Salud)' : (settings.clinic_address || 'Montiel 1255');
                const context = {
                    patient_name: appt.patient_name,
                    date: new Date(appt.appointment_date).toLocaleDateString(),
                    time: new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    doctor_name: doctor?.full_name || 'Doctor',
                    appointment_type: appt.type === 'virtual' ? 'VIRTUAL' : 'PRESENCIAL',
                    appointment_location: address,
                    price: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(appt.type === 'virtual' ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0)),
                    secretary_name: user.name || 'Secretaría'
                };
                if (await handleMetaSend(phone, metaTemplateName, metaParamsOrder, context)) return;
            }
        }

        const dateStr = new Date(appt.appointment_date).toLocaleDateString();
        const timeStr = new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const doctor = doctors.find(d => Number(d.id) === Number(appt.doctor_id));
        const isVirtual = appt.type === 'virtual';

        let messageTemplate = '';
        if (type === 'reminder') {
            messageTemplate = (isVirtual ? doctor?.reminder_virtual_template : doctor?.reminder_template) || (isVirtual ? settings.appointment_reminder_virtual_template : settings.appointment_reminder_template);
            if (!messageTemplate?.trim()) messageTemplate = isVirtual ? `Hola {patient_name}, recordamos tu turno VIRTUAL para el {date} a las {time} con Dr/a. {doctor_name}.` : `Hola {patient_name}, recordamos tu turno para el {date} a las {time} con Dr/a. {doctor_name} en {appointment_location}. Confirma asistencia.`;
        } else {
            messageTemplate = (isVirtual ? doctor?.confirmation_virtual_template : doctor?.confirmation_template) || (isVirtual ? settings.appointment_confirmation_virtual_template : settings.appointment_confirmation_template);
            if (!messageTemplate?.trim()) messageTemplate = isVirtual ? `Hola {patient_name}, confirmamos tu turno VIRTUAL para el {date} a las {time} con Dr/a. {doctor_name}.` : `Hola {patient_name}, confirmamos tu turno para el {date} a las {time} con Dr/a. {doctor_name} en {appointment_location}.`;
        }

        const address = isVirtual ? 'Virtual (Cima Salud)' : (settings.clinic_address || 'Montiel 1255');
        const message = messageTemplate
            .replace(/{patient_name}/g, appt.patient_name || appt.reason)
            .replace(/{date}/g, dateStr).replace(/{time}/g, timeStr).replace(/{doctor_name}/g, appt.doctor_name)
            .replace(/{appointment_location}/g, address)
            .replace(/{price}/g, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(isVirtual ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0)))
            .replace(/{secretary_name}/g, user.name || 'Secretaria');

        try {
            await copyToClipboard(message);
            showMessage(`${type === 'reminder' ? 'Recordatorio' : 'Comprobante'} copiado! Abriendo WhatsApp...`, "success");
            phone = phone.replace(/\D/g, '');
            if (!phone.startsWith('54') && phone.length >= 10) phone = '549' + phone;
            window.location.href = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
            setTimeout(() => { if (!document.hasFocus()) window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank') }, 2500);
        } catch (err) { showMessage("Error al procesar WhatsApp", "error"); }
    };

    return { handleWhatsAppUniversal };
};
