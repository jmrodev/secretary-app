import { useCallback } from 'react';
import { api } from '@/api/axios';

/**
 * Hook that contains specific logic for appointment lifecycle actions (reschedule, cancel, delete, status).
 * It receives CRUD methods and context to perform high-level operations.
 */
export const useAppointmentActions = ({
    t,
    showMessage,
    confirm,
    prompt,
    updateStatus,
    updateAppointment,
    deleteAppointment,
    rescheduleAppointment,
    fetchAppointments,
    setActionModal
}) => {
    const handleReschedule = useCallback(async (apptId, newDateTime) => {
        try {
            const result = await rescheduleAppointment(apptId, newDateTime);
            if (result?.success) {
                fetchAppointments();
            }
            return result;
        } catch (err) {
            console.error('Reschedule failed:', err);
            showMessage(t('reschedule_error'), 'error');
            return { success: false };
        }
    }, [rescheduleAppointment, showMessage, t, fetchAppointments]);

    const handleCancel = useCallback(async (appt) => {
        const reason = await prompt(t('cancellation_reason_prompt'));
        if (!reason || reason.trim() === '') {
            if (reason !== null) showMessage(t('reason_required'), 'warning');
            return;
        }
        if (!await confirm(t('confirm_cancel'))) return;
        try {
            await updateStatus(appt.id, 'cancelled', reason);
            showMessage(t('cancel_success'), 'success');
            fetchAppointments();
        } catch (err) {
            console.error('Cancel failed:', err);
            showMessage(t('cancel_error'), 'error');
        }
    }, [confirm, prompt, updateStatus, showMessage, t, fetchAppointments]);

    const handleDelete = useCallback(async (appt, adminPassword = null) => {
        if (!adminPassword && !await confirm(t('confirm_delete_appointment') || t('confirm_delete'))) return;
        try {
            const result = await deleteAppointment(appt.id, { adminPassword });
            if (result?.success) {
                showMessage(t('appointment_delete_success'), 'success');
                fetchAppointments();
            }
            return result;
        } catch (error) {
            console.error('Failed to delete appointment:', error);
            if (error.response?.data?.type === 'AUTH_REQUIRED') return { type: 'AUTH_REQUIRED' };
            showMessage(t('appointment_delete_error'), 'error');
        }
    }, [confirm, deleteAppointment, showMessage, t, fetchAppointments]);

    const handleStatusUpdate = useCallback(async (apptId, newStatus) => {
        let reason = null;
        if (newStatus === 'cancelled') {
            reason = await prompt(t('cancellation_reason_prompt'));
            if (reason === null) return;
        }
        try {
            await updateStatus(apptId, newStatus, reason);
            showMessage(t('status_update_success'), 'success');
            fetchAppointments();
        } catch (err) {
            console.error('Status update failed:', err);
            showMessage(t('status_update_error'), 'error');
        }
    }, [updateStatus, showMessage, t, fetchAppointments, prompt]);

    const handleTypeUpdate = useCallback(async (apptId, newType) => {
        try {
            await updateAppointment(apptId, { type: newType });
            showMessage(t('type_update_success'), 'success');
        } catch (err) {
            console.error('Type update failed:', err);
            showMessage(t('type_update_error'), 'error');
        }
    }, [updateAppointment, showMessage, t]);

    const handleBonify = useCallback(async (appt) => {
        if (!await confirm(t('confirm_bonify'))) return;
        try {
            await updateAppointment(appt.id, { bonified: true });
            showMessage(t('bonify_success'), 'success');
            fetchAppointments();
            try {
                const updated = await api.get(`/appointments/${appt.id}`);
                if (updated?.data?.data && setActionModal) {
                    setActionModal(prev => (prev.open ? { ...prev, appt: updated.data.data } : prev));
                }
            } catch (refreshErr) {
                // Best-effort refresh of the modal's appointment; ignore failures.
                console.error('Failed to refresh appointment modal after bonify:', refreshErr);
            }
        } catch (err) {
            console.error('Bonify failed:', err);
            showMessage(t('bonify_error'), 'error');
        }
    }, [confirm, updateAppointment, showMessage, t, fetchAppointments, setActionModal]);

    return {
        handleReschedule,
        handleCancel,
        handleDelete,
        handleStatusUpdate,
        handleTypeUpdate,
        handleBonify
    };
};
