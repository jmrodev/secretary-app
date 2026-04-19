import { useFetch } from '@/hooks/useFetch';
import api from '@/api/axios';

export const useDashboardReminders = ({ user, t, settings, showMessage }) => {
    const { 
        data: reminders = [], 
        loading: loadingReminders, 
        error: errorReminders,
        refetch: fetchReminders 
    } = useFetch('/users/reminders', {
        initialData: []
    });

    const formatTemplate = (template, replacements) =>
        Object.entries(replacements).reduce(
            (acc, [key, value]) => acc.replaceAll(`{${key}}`, value ?? ''),
            template
        );

    const handleCompleteReminder = async (reminder, type) => {
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
    };

    const handleMarkNotified = async (reminder, type, notified = true) => {
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
    };

    const handleWhatsAppReminder = (reminder, typeOverride) => {
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
            message = formatTemplate(template, {
                patient_name: reminder.full_name,
                medication_name: reminder.expiring_meds,
                secretary_name: user.full_name || user.name || ''
            });
        } else if (type === 'visit') {
            message = formatTemplate(t('whatsapp_visit_reminder_template'), {
                patient_name: reminder.full_name
            });
        } else if (type === 'prescription') {
            message = formatTemplate(t('whatsapp_prescription_reminder_template'), {
                patient_name: reminder.full_name
            });
        } else if (type === 'license') {
            message = formatTemplate(t('whatsapp_license_reminder_template'), {
                patient_name: reminder.full_name
            });
        }

        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');

        // Auto-mark as notified
        handleMarkNotified(reminder, type, true);
    };

    return {
        reminders,
        loadingReminders,
        errorReminders,
        fetchReminders,
        handleCompleteReminder,
        handleMarkNotified,
        handleWhatsAppReminder
    };
};
