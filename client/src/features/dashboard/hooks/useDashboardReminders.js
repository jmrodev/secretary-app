import { useState } from 'react';
import api from '@/api/axios';

export const useDashboardReminders = ({ user, t, settings, showMessage }) => {
    const [reminders, setReminders] = useState([]);
    const [loadingReminders, setLoadingReminders] = useState(true);

    const fetchReminders = async () => {
        try {
            const res = await api.get('/users/reminders');
            setReminders(res.data);
        } catch (err) {
            console.error("Failed to fetch reminders", err);
        } finally {
            setLoadingReminders(false);
        }
    };

    const handleCompleteReminder = async (reminder, type) => {
        try {
            await api.post('/users/reminders/complete', {
                patientId: reminder.id,
                type: type,
                medIds: reminder.expiring_med_ids
            });
            showMessage(t('reminder_completed') || 'Recordatorio completado', 'success');
            fetchReminders();
        } catch (err) {
            console.error(err);
            showMessage(t('error_completing_reminder') || 'Error al completar recordatorio', 'error');
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
            showMessage(t('status_updated') || 'Estado actualizado', 'success');
            fetchReminders();
        } catch (err) {
            console.error(err);
            showMessage(t('error_updating_status') || 'Error al actualizar estado', 'error');
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
                'Hola {patient_name}, te recordamos que según nuestros registros tu medicación ({medication_name}) está próxima a terminarse. ¿Necesitas que te preparemos la receta? Atte: {secretary_name}';
            message = template
                .replace('{patient_name}', reminder.full_name)
                .replace('{medication_name}', reminder.expiring_meds)
                .replace('{secretary_name}', user.full_name || '');
        } else if (type === 'visit') {
            message = `Hola ${reminder.full_name}, te escribimos de Cima Salud para recordarte que ya es tiempo de tu próximo control sugerido. ¿Te gustaría agendar un turno?`;
        } else if (type === 'prescription') {
            message = `Hola ${reminder.full_name}, te escribimos de Cima Salud para recordarte que es tiempo de renovar tu receta.`;
        } else if (type === 'license') {
            message = `Hola ${reminder.full_name}, te recordamos que tu licencia médica está por vencer.`;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');

        // Auto-mark as notified
        handleMarkNotified(reminder, type, true);
    };

    return {
        reminders,
        loadingReminders,
        fetchReminders,
        handleCompleteReminder,
        handleMarkNotified,
        handleWhatsAppReminder
    };
};
