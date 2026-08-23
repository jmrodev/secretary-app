import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { useFetch } from '@/hooks/useFetch';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { usePermissions } from '@/hooks/usePermissions';
import { api } from '@/api/axios';
import { extractMedicationDetails } from '@/features/medical_documents/utils/medicationHelpers';

const initialState = { isEditing: false, editMeds: [], editNotes: '', editDoctorNote: '' };

function editReducer(state, action) {
    switch (action.type) {
        case 'RESET': return { ...state, isEditing: false, ...action.payload };
        case 'SET_EDITING': return { ...state, isEditing: action.payload };
        case 'UPDATE_FIELD': return { ...state, [action.field]: action.payload };
        default: return state;
    }
}

const unpack = (response, fallback = []) => response?.data || (Array.isArray(response) ? response : fallback);

/**
 * ECC-Pattern: useRequirementManagerController Hook (Global Search Integrated)
 */
export const useRequirementManagerController = (user) => {
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { doubleConfirm } = useModal();
    const { canDeleteRequest } = usePermissions();
    const { searchTerm: globalSearchTerm } = useSearch();

    const [activeTab, setActiveTab] = useState('list');
    const [filter, setFilter] = useState('active');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);

    const [debouncedSearch, setDebouncedSearch] = useState(globalSearchTerm);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(globalSearchTerm), 400);
        return () => clearTimeout(timer);
    }, [globalSearchTerm]);

    // Hook 1: Requests
    const requestsHook = useFetch('/medical/requests', {
        params: {
            page: currentPage,
            limit: itemsPerPage,
            status: filter === 'active' ? ['pending', 'consult'] : ['completed', 'rejected'],
            search: debouncedSearch || undefined
        },
        initialData: { success: true, data: [], meta: { totalCount: 0 } }
    });
    
    // Hook 2: Doctors
    const doctorsHook = useFetch('/users/doctors', { initialData: { success: true, data: [] } });

    // Hook 3: Recycle Bin
    const recycleHook = useFetch('/logs/recycle-bin', {
        initialData: { success: true, data: [] },
        immediate: activeTab === 'recycle' && ['admin', 'secretary'].includes(user?.role)
    });

    const [selectedRequest, setSelectedRequestInternal] = useState(null);
    const [editState, dispatch] = useReducer(editReducer, initialState);

    // Missing state restored here
    const [newMedInput, setNewMedInput] = useState({ name: '', dose: '', frequency: '', quantity: '' });

    // Hook 4: Meds
    const medsUrl = selectedRequest?.patient_id ? `/medical/patients/${selectedRequest.patient_id}/medications` : null;
    const medsHook = useFetch(medsUrl, { initialData: { success: true, data: [] } });

    const requests = useMemo(() => unpack(requestsHook.data), [requestsHook.data]);
    const doctors = useMemo(() => unpack(doctorsHook.data), [doctorsHook.data]);
    const recycleBinData = useMemo(() => unpack(recycleHook.data), [recycleHook.data]);
    const patientMeds = useMemo(() => unpack(medsHook.data), [medsHook.data]);

    const totalCount = requestsHook.data?.meta?.totalCount || requests.length || 0;
    const recycleRequests = useMemo(() => recycleBinData.filter(item => item.entity_type === 'medical_request'), [recycleBinData]);

    // Reset to page 1 whenever the debounced search or filter changes. Applied
    // during render so the new page commits before the fetch effect runs.
    const [prevSearch, setPrevSearch] = useState(debouncedSearch);
    const [prevFilter, setPrevFilter] = useState(filter);
    if (prevSearch !== debouncedSearch || prevFilter !== filter) {
        setPrevSearch(debouncedSearch);
        setPrevFilter(filter);
        setCurrentPage(1);
    }

    const setSelectedRequest = useCallback((req) => {
        setSelectedRequestInternal(req);
        if (req) {
            const { meds, notes } = extractMedicationDetails(req);
            dispatch({
                type: 'RESET',
                payload: { editMeds: meds, editNotes: notes, editDoctorNote: req.doctor_note || '' }
            });
        }
    }, []);

    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');

    const { isEditing, editMeds, editNotes, editDoctorNote } = editState;
    
    useEffect(() => {
        const interval = setInterval(requestsHook.refetch, 30000);
        return () => clearInterval(interval);
    }, [requestsHook.refetch]);

    const handleTabChange = (newTab) => {
        if (newTab === 'new') { setIsNewModalOpen(true); return; }
        setActiveTab(newTab);
        if (newTab === 'list') setCurrentPage(1);
    };

    const confirmAction = async () => {
        if (['rejected', 'consult', 'reply'].includes(actionModal.type) && !actionNote.trim()) {
            showMessage(t('note_required'), 'error'); return;
        }
        try {
            const payload = { status: actionModal.type === 'reply' ? 'consult' : actionModal.type };
            if (actionNote.trim()) {
                if (actionModal.type === 'reply') payload.secretary_note = actionNote;
                else payload.doctor_note = actionNote;
            }
            await api.patch(`/medical/requests/${actionModal.id}`, payload);
            showMessage(t('action_success'), 'success');
            setActionModal({ open: false, type: '', id: null });
            setSelectedRequestInternal(null);
            requestsHook.refetch();
        } catch (err) {
            console.error("[RequirementManagerController] Action error", err);
            showMessage(err.response?.data?.error || t('error_update'), 'error');
        }
    };

    const handleDelete = async (id) => {
        if (await doubleConfirm(t('confirm_delete'), t('confirm_permanent_delete'))) {
            try {
                await api.delete(`/medical/requests/${id}`);
                showMessage('Solicitud eliminada correctamente', 'success');
                requestsHook.refetch();
            } catch (err) {
                console.error("[RequirementManagerController] Delete error", err);
                showMessage("Error al eliminar: " + (err.response?.data?.error || err.message), 'error');
            }
        }
    };

    const handleSaveEdit = async () => {
        try {
            const medsString = editMeds.map(m => `${m.name} ${m.dose || ''}`).join(', ');
            const newRequestNote = `[Solicitud Paciente] ${medsString}\nNotas: ${editNotes}`;
            const payload = { raw_medication_data: JSON.stringify(editMeds), request_note: newRequestNote, doctor_note: editDoctorNote };
            await api.put(`/medical/requests/${selectedRequest.id}`, payload);
            setSelectedRequestInternal(prev => ({ ...prev, ...payload }));
            requestsHook.refetch();
            dispatch({ type: 'SET_EDITING', payload: false });
            showMessage('Cambios guardados correctamente', 'success');
        } catch (error) {
            console.error(error);
            showMessage("Error al guardar cambios", 'error');
        }
    };

    return {
        requests, loading: requestsHook.loading, selectedRequest, setSelectedRequest,
        actionModal, setActionModal, actionNote, setActionNote,
        activeTab, setActiveTab: handleTabChange, isNewModalOpen, setIsNewModalOpen,
        recycleRequests, doctors, filter, setFilter: (f) => { setFilter(f); setCurrentPage(1); },
        canDeleteRequest, confirmAction, handleDelete, fetchRequests: requestsHook.refetch, fetched: requestsHook.fetched,
        patientMeds, isEditing, setIsEditing: (v) => dispatch({ type: 'SET_EDITING', payload: v }), 
        editMeds, setEditMeds: (v) => dispatch({ type: 'UPDATE_FIELD', field: 'editMeds', payload: v }), 
        editNotes, setEditNotes: (v) => dispatch({ type: 'UPDATE_FIELD', field: 'editNotes', payload: v }), 
        newMedInput, setNewMedInput, handleSaveEdit, 
        editDoctorNote, setEditDoctorNote: (v) => dispatch({ type: 'UPDATE_FIELD', field: 'editDoctorNote', payload: v }), 
        checkIsKnown: (medName) => medName && patientMeds.some(pm => (pm.medication_name || pm.name || '').toLowerCase().includes(medName.toLowerCase())),
        currentPage, totalPages: Math.ceil(totalCount / itemsPerPage), totalCount, handlePageChange: (p) => setCurrentPage(p),
        t
    };
};
