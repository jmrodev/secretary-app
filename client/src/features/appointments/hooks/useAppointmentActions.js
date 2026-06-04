import { useCallback } from 'react';

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
    fetchAppointments
}) => {
    const handleReschedule = useCallback(async (apptId, newDateTime) => {
        try {
            const result = await rescheduleAppointment(apptId, newDateTime);
            if (result?.success) {
                fetchAppointments();
            }
            return result;
        } catch {
            showMessage(t('reschedule_error'), 'error');
            return { success: false };
        }
    }, [rescheduleAppointment, showMessage, t, fetchAppointments]);

    const handleCancel = useCallback(async (appt) => {
        const reason = await prompt(t('cancellation_reason_prompt') || "Por favor, ingrese el motivo de la cancelación:");
        if (!reason || reason.trim() === '') {
            if (reason !== null) showMessage(t('reason_required') || "El motivo de la cancelación es obligatorio.", 'warning');
            return;
        }
        if (!await confirm(t('confirm_cancel') || "¿Está seguro de que desea cancelar este turno?")) return;
        try {
            await updateStatus(appt.id, 'cancelled', reason);
            showMessage(t('cancel_success') || "Turno cancelado exitosamente.", 'success');
            fetchAppointments();
        } catch {
            showMessage(t('cancel_error') || "Error al intentar cancelar el turno.", 'error');
        }
    }, [confirm, prompt, updateStatus, showMessage, t, fetchAppointments]);

    const handleDelete = useCallback(async (appt, adminPassword = null) => {
        if (!adminPassword && !await confirm(t('confirm_delete_appointment') || t('confirm_delete') || "¿Está seguro de que desea eliminar este turno permanentemente?")) return;
        try {
            const result = await deleteAppointment(appt.id, { adminPassword });
            if (result?.success) {
                showMessage(t('appointment_delete_success') || "Turno eliminado exitosamente.", 'success');
                fetchAppointments();
            }
            return result;
        } catch (error) {
            if (error.response?.data?.type === 'AUTH_REQUIRED') return { type: 'AUTH_REQUIRED' };
            showMessage(t('appointment_delete_error') || "Error al intentar eliminar el turno.", 'error');
        }
    }, [confirm, deleteAppointment, showMessage, t, fetchAppointments]);

    const handleStatusUpdate = useCallback(async (apptId, newStatus) => {
        let reason = null;
        if (newStatus === 'cancelled') {
            reason = await prompt(t('cancellation_reason_prompt') || "Por favor, ingrese el motivo de la cancelación:");
            if (reason === null) return;
        }
        try {
            await updateStatus(apptId, newStatus, reason);
            showMessage(t('status_update_success') || "Estado del turno actualizado exitosamente.", 'success');
            fetchAppointments();
        } catch {
            showMessage(t('status_update_error') || "Error al intentar actualizar el estado del turno.", 'error');
        }
    }, [updateStatus, showMessage, t, fetchAppointments, prompt]);

    const handleTypeUpdate = useCallback(async (apptId, newType) => {
        try {
            await updateAppointment(apptId, { type: newType });
            showMessage(t('type_update_success') || "Tipo de turno actualizado exitosamente.", 'success');
        } catch {
            showMessage(t('type_update_error') || "Error al intentar actualizar el tipo de turno.", 'error');
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
