import { useCallback } from 'react';
import { api } from '@/api/axios';
import { isToday } from '@/utils/core/dateUtils';

export const useRequestHandlers = ({
    user,
    t,
    showMessage,
    confirm,
    doubleConfirm,
    canDeleteRequest,
    requestEditData,
    selectedRequest,
    setIsEditing,
    setSelectedRequest,
    setRequestEditData,
    setActionModal,
    setActionNote,
    setPaymentModal,
    setRequestsPage,
    fetchRequests,
}) => {
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
            showMessage(t('request_updated'), 'success');
            setIsEditing(false);
            fetchRequests();
            setSelectedRequest(prev => ({ ...prev, ...requestEditData }));
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [selectedRequest, requestEditData, t, showMessage, fetchRequests, setIsEditing, setSelectedRequest]);

    const handleBonifyRequest = useCallback(async (id) => {
        if (!await confirm(t('confirm_bonify'))) return;
        try {
            await api.put(`/medical/requests/${id}`, { payment_status: 'bonified' });
            showMessage(t('bonified_success'), 'success');
            fetchRequests();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [t, showMessage, fetchRequests, confirm]);

    const handleDeleteRequest = useCallback(async (id, r) => {
        if (user?.role !== 'admin' && !canDeleteRequest && (r.status === 'completed' || r.status === 'rejected')) {
            if (!isToday(r.completed_at || r.updated_at)) {
                showMessage(t('admin_only_delete_past_requests'), "warning");
                return;
            }
        }

        if (!await doubleConfirm(
            t('confirm_delete'),
            t('confirm_permanent_delete')
        )) return;
        try {
            await api.delete(`/medical/requests/${id}`);
            showMessage(t('deleted_success'), 'success');
            fetchRequests();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [user, canDeleteRequest, doubleConfirm, t, showMessage, fetchRequests]);

    const handleRequestEditDataChange = useCallback((field, val) => setRequestEditData(prev => ({ ...prev, [field]: val })), [setRequestEditData]);

    const openActionModal = useCallback((type, id) => setActionModal({ open: true, type, id }), [setActionModal]);
    const closeActionModal = useCallback(() => { setActionModal({ open: false, type: '', id: null }); setActionNote(''); }, [setActionModal, setActionNote]);

    const openPaymentModal = useCallback((data) => setPaymentModal(data), [setPaymentModal]);
    const closePaymentModal = useCallback(() => setPaymentModal({ open: false, initialData: {} }), [setPaymentModal]);

    const handleEditItem = useCallback((r) => {
        setSelectedRequest(r);
        setRequestEditData({
            request_note: r.request_note || '',
            doctor_note: r.doctor_note || '',
            items: r.items || [],
            _readOnly: Boolean(r._readOnly)
        });
        setIsEditing(true);
    }, [setSelectedRequest, setRequestEditData, setIsEditing]);

    const handlePageChange = useCallback((page) => setRequestsPage(page), [setRequestsPage]);

    return {
        handleUpdateStatus,
        handleUpdateRequest,
        handleBonifyRequest,
        handleDeleteRequest,
        handleRequestEditDataChange,
        openActionModal,
        closeActionModal,
        openPaymentModal,
        closePaymentModal,
        handleEditItem,
        handlePageChange,
        setRequestEditData,
        setActionNote,
        fetchRequests
    };
};
