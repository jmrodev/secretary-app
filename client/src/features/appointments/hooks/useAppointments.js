import { useState, useCallback } from 'react';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import { useConfig } from '@/context/ConfigContext';

/**
 * Hook to manage individual appointment CRUD operations.
 */
export const useAppointments = () => {
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { alert, confirm, prompt, doubleConfirm } = useModal();
    const { settings } = useConfig();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateStatus = async (id, status, onUpdate) => {
        let reason = null;
        if (status === 'cancelled') {
            reason = await prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
            if (reason === null) return;
        }

        try {
            setIsSubmitting(true);
            await api.put(`/appointments/${id}/status`, { status, reason });
            showMessage(t('status_updated'), 'success');
            if (onUpdate) onUpdate(id, status);
            return { success: true };
        } catch (err) {
            console.error(err);
            showMessage(t('failed_update'), 'error');
            return { success: false };
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelAppointment = async (id, onUpdate, providedReason = null) => {
        let reason = providedReason;
        if (!reason) {
            reason = await prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
        }
        if (!reason || reason.trim() === '') {
            showMessage(t('reason_required') || 'Debe ingresar un motivo para cancelar.', 'warning');
            return { success: false };
        }
        if (!await confirm(t('confirm_cancel'))) return;

        try {
            setIsSubmitting(true);
            await api.put(`/appointments/${id}/status`, { status: 'cancelled', reason });
            showMessage(t('appointment_cancelled'), 'success');
            if (onUpdate) onUpdate(id, 'cancelled');
            return { success: true };
        } catch (err) {
            console.error(err);
            showMessage(t('failed_cancel'), 'error');
            return { success: false };
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteAppointment = async (id, apptData, options = {}) => {
        const { adminPassword, onUpdate, viewDoctorId } = options;
        if (apptData && (apptData.status === 'completed' || apptData.status === 'attended') &&
            settings.enable_secretary_unrestricted_crud !== 'true' && !adminPassword) {
            await alert(t('cannot_delete_attended') || "Cannot delete an appointment that has been attended.");
            return { type: 'AUTH_REQUIRED' };
        }

        if (!adminPassword && !await doubleConfirm(
            t('confirm_delete_appointment') || "¿Está seguro? Esto eliminará el registro permanentemente.",
            t('confirm_permanent_delete') || "Esta acción es irreversible. ¿Confirmar eliminación definitiva?"
        )) return { cancelled: true };

        try {
            setIsSubmitting(true);
            if (String(id).startsWith('goo_')) {
                const eventId = id.replace('goo_', '');
                await api.delete(`/google/appointments/${eventId}`, { data: { doctorId: viewDoctorId } });
            } else {
                await api.delete(`/appointments/${id}`, { data: { adminPassword } });
            }
            showMessage(t('appointment_deleted'), 'success');
            if (onUpdate) onUpdate();
            return { success: true };
        } catch (err) {
            console.error(err);
            if (err.response?.data?.type === 'AUTH_REQUIRED') return { type: 'AUTH_REQUIRED' };
            const serverError = err.response?.data?.error || err.response?.data;
            showMessage(serverError || t('failed_delete'), 'error');
            return { success: false, error: serverError };
        } finally {
            setIsSubmitting(false);
        }
    };

    const rescheduleAppointment = async (id, newDate, adminPassword, onUpdate) => {
        try {
            setIsSubmitting(true);
            const isoDate = new Date(newDate).toISOString();
            await api.put(`/appointments/${id}`, { appointment_date: isoDate, adminPassword });
            showMessage(t('rescheduled_success'), 'success');
            if (onUpdate) onUpdate();
            return { success: true };
        } catch (err) {
            console.error(err);
            if (err.response?.data?.type === 'AUTH_REQUIRED') return { type: 'AUTH_REQUIRED' };
            showMessage(t('failed_reschedule'), 'error');
            return { success: false };
        } finally {
            setIsSubmitting(false);
        }
    };

    const savePrescription = async (data, onUpdate) => {
        if (!data.medications?.trim() && (!data.items || data.items.length === 0)) {
            showMessage(t('please_enter_meds'), 'warning');
            return { success: false };
        }
        try {
            setIsSubmitting(true);
            await api.post('/medical/prescriptions', {
                appointment_id: data.apptId,
                patientId: data.patientId,
                medications: data.medications,
                instructions: data.instructions,
                items: data.items,
                bonified: data.bonified
            });
            showMessage(t('prescription_created'), 'success');
            if (onUpdate) onUpdate();
            return { success: true };
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data || t('failed_prescription');
            showMessage(errMsg, 'error');
            return { success: false };
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateAppointment = async (id, data, onUpdate) => {
        try {
            setIsSubmitting(true);
            await api.put(`/appointments/${id}`, data);
            showMessage(t('appointment_updated') || 'Turno actualizado', 'success');
            if (onUpdate) onUpdate();
            return { success: true };
        } catch (err) {
            console.error(err);
            if (err.response?.data?.type === 'AUTH_REQUIRED') return { type: 'AUTH_REQUIRED' };
            showMessage(t('failed_update'), 'error');
            return { success: false };
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMonthlyReport = async (month, year, doctorId = null) => {
        try {
            const params = { month, year };
            if (doctorId) params.doctorId = doctorId;
            const response = await api.get('/appointments/month-report', { params });
            return response.data;
        } catch (err) {
            console.error(err);
            showMessage('Error al obtener el reporte', 'error');
            return null;
        }
    };

    return {
        updateStatus,
        updateAppointment,
        cancelAppointment,
        deleteAppointment,
        rescheduleAppointment,
        savePrescription,
        getMonthlyReport,
        isSubmitting
    };
};
