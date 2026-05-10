import { useCallback, useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import api from '@/api/axios';
import { replaceTemplateVariables } from '@/utils/stringUtils';

export const useDashboardReminders = ({ user, t, settings, showMessage }) => {
    const remindersHook = useFetch('/users/reminders', {
        initialData: []
    });
    const { 
        data: reminders = [], 
        loading: loadingReminders, 
        error: errorReminders,
        refetch: fetchReminders 
    } = remindersHook;


    const handleCompleteReminder = useCallback(async (reminder, type) => {
        try {
            await api.post('/users/reminders/complete', {
                patientId: reminder.id,
                type: type,
                medIds: reminder.expiring_med_ids
            });
            showMessage(t('reminder_completed'), 'success');
            fetchReminders();
        } catch (err) {
            console.error(err);
            showMessage(t('error_completing_reminder'), 'error');
        }
    }, [t, showMessage, fetchReminders]);

    const handleMarkNotified = useCallback(async (reminder, type, notified = true) => {
        try {
            await api.post('/users/reminders/complete', {
                patientId: reminder.id,
                type: type,
                medIds: reminder.expiring_med_ids,
                notified: notified
            });
            showMessage(t('status_updated'), 'success');
            fetchReminders();
        } catch (err) {
            console.error(err);
            showMessage(t('error_updating_status'), 'error');
        }
    }, [t, showMessage, fetchReminders]);

    const handleWhatsAppReminder = useCallback((reminder, typeOverride) => {
        const phone = reminder.phone;
        if (!phone) return showMessage(t('no_phone_available'), 'error');

        let type = typeOverride || 'visit';
        if (!typeOverride) {
            if (reminder.expiring_meds) type = 'medication';
            else if (reminder.next_suggested_prescription_date) type = 'prescription';
            else if (reminder.license_expiry_date) type = 'license';
        }

        let message = '';
        if (type === 'medication') {
            const template = settings.medication_refill_reminder_template ||
                t('whatsapp_medication_reminder_template');
            message = replaceTemplateVariables(template, {
                patient_name: reminder.full_name,
                medication_name: reminder.expiring_meds,
                secretary_name: user.full_name || user.name || ''
            });
        } else if (type === 'visit') {
            message = replaceTemplateVariables(t('whatsapp_visit_reminder_template'), {
                patient_name: reminder.full_name
            });
        } else if (type === 'prescription') {
            message = replaceTemplateVariables(t('whatsapp_prescription_reminder_template'), {
                patient_name: reminder.full_name
            });
        } else if (type === 'license') {
            message = replaceTemplateVariables(t('whatsapp_license_reminder_template'), {
                patient_name: reminder.full_name
            });
        }

        const cleanPhone = phone.replace(/\D/g, '');
        let normalizedPhone = cleanPhone;
        if (!normalizedPhone.startsWith('54') && normalizedPhone.length >= 10) normalizedPhone = '549' + normalizedPhone;

        // Try direct send via bridge
        const sendDirect = async () => {
            try {
                showMessage(t('sending_whatsapp') || 'Enviando WhatsApp...', 'info');
                await api.post('/whatsapp/send-direct', {
                    to: normalizedPhone,
                    message: message
                });
                showMessage(t('whatsapp_sent') || 'Mensaje enviado!', 'success');
                // Auto-mark as notified
                handleMarkNotified(reminder, type, true);
            } catch (err) {
                console.error("Direct send failed, falling back to manual", err);
                window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                // Still mark as notified as we opened the link
                handleMarkNotified(reminder, type, true);
            }
        };

        sendDirect();
    }, [t, showMessage, user, settings, handleMarkNotified]);

    return useMemo(() => ({
        reminders,
        loadingReminders,
        fetched: remindersHook.fetched,
        errorReminders,
        fetchReminders,
        handleCompleteReminder,
        handleMarkNotified,
        handleWhatsAppReminder
    }), [
        reminders, loadingReminders, remindersHook.fetched, errorReminders, fetchReminders,
        handleCompleteReminder, handleMarkNotified, handleWhatsAppReminder
    ]);

};
