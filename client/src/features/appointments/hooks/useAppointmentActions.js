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
        if (!await confirm(t('confirm_cancel'))) return;
        try {
            await updateStatus(appt.id, 'cancelled');
            showMessage(t('cancel_success'), 'success');
        } catch (error) {
            showMessage(t('cancel_error'), 'error');
        }
    }, [confirm, updateStatus, showMessage, t]);

    const handleDelete = useCallback(async (appt) => {
        if (!await confirm(t('confirm_delete'))) return;
        try {
            await deleteAppointment(appt.id);
            showMessage(t('delete_success'), 'success');
        } catch (error) {
            showMessage(t('delete_error'), 'error');
        }
    }, [confirm, deleteAppointment, showMessage, t]);

    const handleStatusUpdate = useCallback(async (apptId, newStatus) => {
        try {
            await updateStatus(apptId, newStatus);
            showMessage(t('status_update_success'), 'success');
        } catch (error) {
            showMessage(t('status_update_error'), 'error');
        }
    }, [updateStatus, showMessage, t]);

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
