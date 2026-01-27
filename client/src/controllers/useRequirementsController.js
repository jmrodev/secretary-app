import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Controller hook for the Requests page and RequirementsList component.
 * Manages medical requests, recycle bin, status updates, and filtering.
 */
export const useRequirementsController = (user) => {
    // State
    const [allRequests, setAllRequests] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');
    const [activeTab, setActiveTab] = useState('list'); // 'new' | 'list' | 'recycle'
    const [recycleRequests, setRecycleRequests] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [filter, setFilter] = useState('active'); // 'active' | 'history'

    // Contexts
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { doubleConfirm, confirm } = useModal();

    // --- Data Fetching ---

    const fetchRequests = useCallback(async () => {
        try {
            const res = await api.get('/medical/requests');
            setAllRequests(res.data);
        } catch (err) {
            console.error("[RequirementsController] Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDoctors = useCallback(async () => {
        try {
            const res = await api.get('/users/doctors');
            setDoctors(res.data);
        } catch (err) {
            console.error("[RequirementsController] Failed to fetch doctors", err);
        }
    }, []);

    const fetchRecycleBin = useCallback(async () => {
        if (!['admin', 'secretary'].includes(user?.role)) return;
        try {
            const res = await api.get('/logs/recycle-bin');
            setRecycleRequests(res.data.filter(item => item.entity_type === 'medical_request'));
        } catch (err) {
            console.error("[RequirementsController] Failed to fetch recycle bin", err);
        }
    }, [user?.role]);

    // --- Filtering ---

    useEffect(() => {
        const filtered = allRequests.filter(r => {
            if (filter === 'active') {
                return r.status === 'pending' || r.status === 'consult';
            }
            return r.status === 'completed' || r.status === 'rejected';
        });
        setRequests(filtered);
    }, [filter, allRequests]);

    // --- Lifecycle ---

    useEffect(() => {
        fetchRequests();
        fetchDoctors();
        const interval = setInterval(fetchRequests, 15000);
        return () => clearInterval(interval);
    }, [fetchRequests, fetchDoctors]);

    useEffect(() => {
        if (activeTab === 'recycle') {
            fetchRecycleBin();
        }
    }, [activeTab, fetchRecycleBin]);

    // --- Actions ---

    const handleRestore = async (item) => {
        if (await confirm(`¿Restaurar solicitud de ${item.entity_name}?`)) {
            try {
                await api.post(`/logs/restore/${item.id}`);
                showMessage('Solicitud restaurada exitosamente', 'success');
                fetchRecycleBin();
                fetchRequests();
            } catch (err) {
                console.error("[RequirementsController] Restore error", err);
                showMessage('Error al restaurar: ' + (err.response?.data?.message || err.message), 'error');
            }
        }
    };

    const openActionModal = (type, id) => {
        setActionModal({ open: true, type, id });
        setActionNote('');
    };

    const confirmAction = async () => {
        if (['rejected', 'consult', 'reply'].includes(actionModal.type) && !actionNote.trim()) {
            showMessage(t('note_required') || 'Note is required', 'error');
            return;
        }

        try {
            const payload = { status: actionModal.type === 'reply' ? 'consult' : actionModal.type };
            if (actionNote.trim()) {
                if (actionModal.type === 'reply') payload.secretary_note = actionNote;
                else payload.doctor_note = actionNote;
            }

            await api.patch(`/medical/requests/${actionModal.id}`, payload);
            showMessage(t('action_success') || 'Updated successfully', 'success');
            setActionModal({ open: false, type: '', id: null });
            fetchRequests();
        } catch (err) {
            console.error("[RequirementsController] Action error", err);
            showMessage(err.response?.data?.message || t('error_update') || 'Failed to update', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (await doubleConfirm(
            t('confirm_delete') || '¿Seguro que desea eliminar?',
            t('confirm_permanent_delete') || 'Esta acción eliminará el registro permanentemente.'
        )) {
            try {
                await api.delete(`/medical/requests/${id}`);
                showMessage('Solicitud eliminada correctamente', 'success');
                fetchRequests();
            } catch (err) {
                console.error("[RequirementsController] Delete error", err);
                showMessage("Error al eliminar: " + (err.response?.data?.message || err.message), 'error');
            }
        }
    };

    const { canDeleteRequest } = usePermissions();

    return {
        // State
        requests,
        loading,
        selectedRequest,
        setSelectedRequest,
        actionModal,
        setActionModal,
        actionNote,
        setActionNote,
        activeTab,
        setActiveTab,
        recycleRequests,
        doctors,
        filter,
        setFilter,

        // Permissions
        canDeleteRequest,

        // Handlers
        handleRestore,
        openActionModal,
        confirmAction,
        handleDelete,
        fetchRequests
    };
};
