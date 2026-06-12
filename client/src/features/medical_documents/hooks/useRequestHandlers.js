import { useCallback } from 'react';
import api from '@/api/axios';
import { isToday } from '@/utils/core/dateUtils';

export const useRequestHandlers = ({
    user,
    t,
    showMessage,
    confirm,
    doubleConfirm,
    canDeleteRequest,
    reqType,
    selectedPatient,
    selectedDoctor,
    reqNote,
    sendToDoctor,
    requestEditData,
    selectedRequest,
    setReqNote,
    setSendToDoctor,
    setIsSubmitting,
    setIsEditing,
    setSelectedRequest,
    setRequestEditData,
    setActionModal,
    fetchRequests,
}) => {
    const handleCreateRequest = useCallback(async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patientId: selectedPatient,
                doctor_id: user?.role === 'doctor' ? (user.user_id || user.id) : selectedDoctor,
                request_note: reqNote,
                status: sendToDoctor ? 'pending' : 'completed'
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed') || 'Guardado como Completado'), 'success');
            setReqNote('');
            setSendToDoctor(true);
            fetchRequests();
        } catch (err) {
            const errorMsg = err.response?.data || err.message || t('request_failed');
            showMessage(`${t('request_failed')}: ${errorMsg}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    }, [reqType, selectedPatient, user, selectedDoctor, reqNote, sendToDoctor, t, showMessage, fetchRequests, setIsSubmitting, setReqNote, setSendToDoctor]);

    const handleUpdateStatus = useCallback(async (id, status, note = '') => {
        try {
            await api.patch(`/medical/requests/${id}`, { status, doctor_note: note });
            setActionModal({ open: false, type: '', id: null });
            setSelectedRequest(null);
            setIsEditing(false);
            fetchRequests();
            showMessage(t('status_updated'), 'success');
        } catch {
            showMessage(t('update_failed'), 'error');
        }
    }, [t, showMessage, fetchRequests, setActionModal, setSelectedRequest, setIsEditing]);

    const handleUpdateRequest = useCallback(async () => {
        if (!selectedRequest) return;
        try {
            await api.put(`/medical/requests/${selectedRequest.id}`, requestEditData);
            showMessage(t('request_updated') || 'Solicitud actualizada', 'success');
            setIsEditing(false);
            fetchRequests();
            setSelectedRequest(prev => ({ ...prev, ...requestEditData }));
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [selectedRequest, requestEditData, t, showMessage, fetchRequests, setIsEditing, setSelectedRequest]);

    const handleBonifyRequest = useCallback(async (id) => {
        if (!await confirm(t('confirm_bonify') || '¿Seguro que desea marcar como bonificado? Esto cancelará deudas pendientes.')) return;
        try {
            await api.put(`/medical/requests/${id}`, { payment_status: 'bonified' });
            showMessage(t('bonified_success') || 'Carga realizada con bonificación exitosa', 'success');
            fetchRequests();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [t, showMessage, fetchRequests, confirm]);

    const handleDeleteRequest = useCallback(async (id, r) => {
        if (user?.role !== 'admin' && !canDeleteRequest && (r.status === 'completed' || r.status === 'rejected')) {
            if (!isToday(r.completed_at || r.updated_at)) {
                showMessage("Solo administradores pueden eliminar solicitudes finalizadas de días anteriores.", "warning");
                return;
            }
        }

        if (!await doubleConfirm(
            t('confirm_delete') || '¿Seguro que desea eliminar?',
            t('confirm_permanent_delete') || 'Esta acción eliminará el registro permanentemente. ¿Confirmar segunda vez?'
        )) return;
        try {
            await api.delete(`/medical/requests/${id}`);
            showMessage(t('deleted_success') || 'Eliminado correctamente', 'success');
            fetchRequests();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [user, canDeleteRequest, doubleConfirm, t, showMessage, fetchRequests]);

    const handleRequestEditDataChange = useCallback((field, val) => setRequestEditData(prev => ({ ...prev, [field]: val })), [setRequestEditData]);

    return {
        handleCreateRequest,
        handleUpdateStatus,
        handleUpdateRequest,
        handleBonifyRequest,
        handleDeleteRequest,
        handleRequestEditDataChange
    };
};
