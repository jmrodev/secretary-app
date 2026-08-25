import { useMessage } from '@/context/MessageContext';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/features/auth/AuthContext';
import { useModal } from '@/context/ModalContext';
import { copyToClipboard } from '@/utils/core/clipboardUtils';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';
import { api } from '@/api/axios';

/**
 * Renders a WhatsApp message template with appointment context variables.
 * Exported so controllers can pre-render templates without going through the full hook flow.
 */
export const buildWhatsAppMessage = ({ appt, doctor, settings, user, type = 'confirmation' }) => {
    const dateStr = formatDate(appt.appointment_date);
    const timeStr = formatTime(appt.appointment_date, { hour12: false });
    const isVirtual = appt.type === 'virtual';
    const address = isVirtual ? 'Virtual (Cima Salud)' : (settings.clinic_address || 'Montiel 1255');
    const price = formatCurrency(isVirtual ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0));
    const apptType = isVirtual ? 'VIRTUAL' : 'PRESENCIAL';

    let messageTemplate;
    if (type === 'reminder') {
        messageTemplate = (isVirtual ? doctor?.reminder_virtual_template : doctor?.reminder_template)
            || (isVirtual ? settings.appointment_reminder_virtual_template : settings.appointment_reminder_template);
        if (!messageTemplate?.trim()) messageTemplate = isVirtual
            ? `Hola {patient_name}, recordamos tu turno VIRTUAL para el {date} a las {time} con Dr/a. {doctor_name}.`
            : `Hola {patient_name}, recordamos tu turno para el {date} a las {time} con Dr/a. {doctor_name} en {appointment_location}. Confirma asistencia.`;
    } else {
        messageTemplate = (isVirtual ? doctor?.confirmation_virtual_template : doctor?.confirmation_template)
            || (isVirtual ? settings.appointment_confirmation_virtual_template : settings.appointment_confirmation_template);
        if (!messageTemplate?.trim()) messageTemplate = isVirtual
            ? `Hola {patient_name}, confirmamos tu turno VIRTUAL para el {date} a las {time} con Dr/a. {doctor_name}.`
            : `Hola {patient_name}, confirmamos tu turno para el {date} a las {time} con Dr/a. {doctor_name} en {appointment_location}.`;
    }

    return messageTemplate
        .replace(/{patient_name}/g, appt.patient_name || appt.reason)
        .replace(/{date}/g, dateStr)
        .replace(/{time}/g, timeStr)
        .replace(/{doctor_name}/g, appt.doctor_name || doctor?.full_name || 'Doctor')
        .replace(/{appointment_location}/g, address)
        .replace(/{appointment_type}/g, apptType)
        .replace(/{price}/g, price)
        .replace(/{secretary_name}/g, user?.name || 'Secretaria');
};

/**
 * useWhatsAppUniversal (Handler Hook).
 * Logic for sending WhatsApp messages (Chat/Reminders) for appointments.
 * Confirmation messages are handled separately via WhatsAppModal + handleWhatsAppConfirmation.
 */
export const useWhatsAppUniversal = (doctors) => {
    const { showMessage } = useMessage();
    const { settings } = useConfig();
    const { user } = useAuth();
    const { confirm } = useModal();

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

        // Normalize phone upfront for all branches
        let normalizedPhone = phone.replace(/\D/g, '');
        if (!normalizedPhone.startsWith('54') && normalizedPhone.length >= 10) normalizedPhone = '549' + normalizedPhone;

        // --- CHAT branch: open GlobalWhatsappMessenger or fall back to wa.me ---
        if (type === 'chat') {
            const confirmed = await confirm(
                `¿Abrir chat de WhatsApp con ${appt.patient_name || 'el paciente'}?`
            );
            if (!confirmed) return;

            let bridgeConnected = false;
            try {
                const res = await api.get('/whatsapp/status');
                bridgeConnected = res.data?.status === 'connected';
            } catch (err) {
                // Treat as offline, but record the failure instead of swallowing it silently
                console.warn('[useWhatsAppUniversal] WhatsApp status check failed; treating bridge as offline:', err);
            }

            if (bridgeConnected) {
                window.dispatchEvent(new CustomEvent('whatsapp:open-chat', {
                    detail: {
                        phone: normalizedPhone,
                        patientId: appt.patient_id || null,
                        patientName: appt.patient_name || phone,
                    }
                }));
            } else {
                showMessage('Bridge desconectado — abriendo WhatsApp Web...', 'info');
                window.open(`https://wa.me/${normalizedPhone}`, '_blank');
            }
            return;
        }

        if (type === 'reminder') {
            const confirmed = await confirm(
                `¿Enviar recordatorio de WhatsApp a ${appt.patient_name || 'el paciente'}?`
            );
            if (!confirmed) return;

            const metaTemplateName = settings.meta_reminder_template_name;
            const metaParamsOrder = settings.meta_reminder_params_order;

            if (settings.meta_phone_number_id && metaTemplateName && metaParamsOrder) {
                const doctor = doctors.find(d => d.id === Number(appt.doctor_id));
                const address = appt.type === 'virtual' ? 'Virtual (Cima Salud)' : (settings.clinic_address || 'Montiel 1255');
                const context = {
                    patient_name: appt.patient_name,
                    date: formatDate(appt.appointment_date),
                    time: formatTime(appt.appointment_date, { hour12: false }),
                    doctor_name: doctor?.full_name || 'Doctor',
                    appointment_type: appt.type === 'virtual' ? 'VIRTUAL' : 'PRESENCIAL',
                    appointment_location: address,
                    price: formatCurrency(appt.type === 'virtual' ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0)),
                    secretary_name: user.name || 'Secretaría'
                };
                if (await handleMetaSend(phone, metaTemplateName, metaParamsOrder, context)) return;
            }

            const doctor = doctors.find(d => Number(d.id) === Number(appt.doctor_id));
            const message = buildWhatsAppMessage({ appt, doctor, settings, user, type: 'reminder' });

            // Phase 2: Local Bridge Integration (Automated Send)
            // We prioritize the local bridge if it exists, regardless of the setting, 
            // to fulfill the user's request for "auto-send"
            try {
                showMessage('Enviando mensaje automáticamente...', 'info');
                await api.post('/whatsapp/send-direct', { to: normalizedPhone, message });
                showMessage('Mensaje enviado automáticamente', 'success');
                return; // Exit if sent successfully
            } catch (err) {
                console.error("Local Bridge Error:", err);
                // Fallback to manual copy...
            }

            try {
                await copyToClipboard(message);
                showMessage(`Recordatorio copiado! Abriendo WhatsApp...`, "success");
                window.location.href = `whatsapp://send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`;
                setTimeout(() => { if (!document.hasFocus()) window.open(`https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`, '_blank') }, 2500);
            } catch { showMessage("Error al procesar WhatsApp", "error"); }
        }
    };

    return { handleWhatsAppUniversal };
};
