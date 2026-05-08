import { useCallback } from 'react';

/**
 * Hook that contains specific logic for appointment lifecycle actions (reschedule, cancel, delete, status).
 * It receives CRUD methods and context to perform high-level operations.
 */
export const useAppointmentActions = ({
    user,
    t,
    showMessage,
    confirm,
    prompt,
    navigate,
    updateStatus,
    updateAppointment,
    deleteAppointment,
    rescheduleAppointment,
    bookAppointment,
    savePrescription,
    fetchAppointments
}) => {
    const handleReschedule = useCallback(async (apptId, newDateTime) => {
        try {
            const result = await rescheduleAppointment(apptId, newDateTime);
            if (result?.success) {
                fetchAppointments();
            }
            return result;
        } catch (error) {
            showMessage(t('reschedule_error'), 'error');
            return { success: false };
        }
    }, [rescheduleAppointment, showMessage, t, fetchAppointments]);

    const handleCancel = useCallback(async (appt) => {
        const reason = await prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
        if (!reason || reason.trim() === '') {
            if (reason !== null) showMessage(t('reason_required'), 'warning');
            return;
        }
        if (!await confirm(t('confirm_cancel'))) return;
        try {
            await updateStatus(appt.id, 'cancelled', reason);
            showMessage(t('cancel_success'), 'success');
            fetchAppointments();
        } catch (error) {
            showMessage(t('cancel_error'), 'error');
        }
    }, [confirm, prompt, updateStatus, showMessage, t, fetchAppointments]);

    const handleDelete = useCallback(async (appt, adminPassword = null) => {
        if (!adminPassword && !await confirm(t('confirm_delete'))) return;
        try {
            const result = await deleteAppointment(appt.id, { adminPassword });
            if (result?.success) {
                showMessage(t('delete_success'), 'success');
                fetchAppointments();
            }
            return result;
        } catch (error) {
            if (error.response?.data?.type === 'AUTH_REQUIRED') return { type: 'AUTH_REQUIRED' };
            showMessage(t('delete_error'), 'error');
        }
    }, [confirm, deleteAppointment, showMessage, t, fetchAppointments]);

    const handleStatusUpdate = useCallback(async (apptId, newStatus) => {
        let reason = null;
        if (newStatus === 'cancelled') {
            reason = await prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
            if (reason === null) return;
        }
        try {
            await updateStatus(apptId, newStatus, reason);
            showMessage(t('status_update_success'), 'success');
            fetchAppointments();
        } catch (error) {
            showMessage(t('status_update_error'), 'error');
        }
    }, [updateStatus, showMessage, t, fetchAppointments, prompt]);

    const handleTypeUpdate = useCallback(async (apptId, newType) => {
        try {
            await updateAppointment(apptId, { type: newType });
            showMessage(t('type_update_success'), 'success');
        } catch (error) {
            showMessage(t('type_update_error'), 'error');
        }
    }, [updateAppointment, showMessage, t]);

    return {
        handleReschedule,
        handleCancel,
        handleDelete,
        handleStatusUpdate,
        handleTypeUpdate
    };
};
