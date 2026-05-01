import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useFetch } from '@/hooks/useFetch';
import { extractMedicationDetails } from '@/utils/medicationHelpers';

/**
 * Controller hook for the Medical Documents Manager.
 * Orchestrates the listed requests, history, and recycle bin.
 */
export const useRequirementManagerController = (user) => {
    // Contexts
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { doubleConfirm, confirm } = useModal();
    const { canDeleteRequest } = usePermissions();

    // View State
    const [activeTab, setActiveTab] = useState('list'); // 'new' | 'list' | 'recycle'
    const [filter, setFilter] = useState('active'); // 'active' | 'history'
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);

    // --- FETCH DATA using useFetch ---

    // Requests
    const { 
        data: requestsData = { requests: [], totalCount: 0 }, 
        loading: requestsLoading, 
        refetch: fetchRequests 
    } = useFetch('/medical/requests', {
        params: {
            page: currentPage,
            limit: itemsPerPage,
            status: filter === 'active' ? ['pending', 'consult'] : ['completed', 'rejected']
        },
        initialData: { requests: [], totalCount: 0 }
    });

    const requests = requestsData.requests || [];
    const totalCount = requestsData.totalCount || 0;

    // Doctors
    const { data: doctorsData } = useFetch('/users/doctors', { initialData: { doctors: [], totalCount: 0 } });
    const doctors = doctorsData?.doctors || [];

    // Recycle Bin
    const { 
        data: recycleBinData = [], 
        refetch: fetchRecycleBin 
    } = useFetch('/logs/recycle-bin', {
        initialData: [],
        immediate: activeTab === 'recycle' && ['admin', 'secretary'].includes(user?.role)
    });

    const recycleRequests = recycleBinData.filter(item => item.entity_type === 'medical_request');

    // Selection/Edit State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');

    // --- Side Effects for Medications ---

    const { 
        data: patientMeds = [], 
        loading: fetchingMeds,
        refetch: fetchPatientMeds 
    } = useFetch(selectedRequest?.patient_id ? `/medical/patients/${selectedRequest.patient_id}/medications` : null, {
        initialData: []
    });

    // Medication/Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editMeds, setEditMeds] = useState([]);
    const [editNotes, setEditNotes] = useState('');
    const [editDoctorNote, setEditDoctorNote] = useState('');
    const [newMedInput, setNewMedInput] = useState({ name: '', dose: '', frequency: '', quantity: '' });

    // Polling Logic
    useEffect(() => {
        const interval = setInterval(fetchRequests, 30000);
        return () => clearInterval(interval);
    }, [fetchRequests]);

    const loading = requestsLoading;

    useEffect(() => {
        if (selectedRequest) {
            queueMicrotask(() => {
                setIsEditing(false);
                const { meds, notes } = extractMedicationDetails(selectedRequest);
                setEditMeds(meds);
                setEditNotes(notes);
                setEditDoctorNote(selectedRequest.doctor_note || '');
            });
        }
    }, [selectedRequest]);

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        if (newTab === 'list') {
            setCurrentPage(1);
        }
    };

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleRestore = async (item) => {
        if (await confirm(`¿Restaurar solicitud de ${item.entity_name}?`)) {
            try {
                await api.post(`/logs/restore/${item.id}`);
                showMessage('Solicitud restaurada exitosamente', 'success');
                fetchRecycleBin();
                fetchRequests();
            } catch (err) {
                console.error("[RequirementManagerController] Restore error", err);
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
            setSelectedRequest(null);
            fetchRequests();
        } catch (err) {
            console.error("[RequirementManagerController] Action error", err);
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
                console.error("[RequirementManagerController] Delete error", err);
                showMessage("Error al eliminar: " + (err.response?.data?.message || err.message), 'error');
            }
        }
    };

    const addToChronic = async (medName) => {
        if (!await confirm(`¿Desea agregar "${medName}" a la lista de medicación crónica del paciente?`)) return;

        try {
            await api.post('/medical/patients/medications', {
                patient_id: selectedRequest.patient_id,
                medication_name: medName,
                is_chronic: true,
                status: 'active'
            });
            fetchPatientMeds();
            showMessage('Medicación agregada exitosamente', 'success');
        } catch (e) {
            console.error(e);
            showMessage("Error al agregar medicación", 'error');
        }
    };

    const handleSaveEdit = async () => {
        try {
            const medsString = editMeds.map(m => {
                let s = m.name;
                if (m.dose) s += ` ${m.dose}`;
                if (m.frequency) s += ` (${m.frequency})`;
                if (m.quantity) s += ` [Qty: ${m.quantity}]`;
                return s;
            }).join(', ');

            const newRequestNote = `[Solicitud Paciente] ${medsString}\nNotas: ${editNotes}`;
            const payload = {
                raw_medication_data: JSON.stringify(editMeds),
                request_note: newRequestNote,
                doctor_note: editDoctorNote
            };

            await api.put(`/medical/requests/${selectedRequest.id}`, payload);

            setSelectedRequest(prev => ({
                ...prev,
                ...payload,
                raw_medication_data: JSON.stringify(editMeds)
            }));
            fetchRequests();
            setIsEditing(false);
            showMessage('Cambios guardados correctamente', 'success');
        } catch (error) {
            console.error(error);
            showMessage("Error al guardar cambios", 'error');
        }
    };

    const updateEditMed = (index, field, value) => {
        const newMeds = [...editMeds];
        newMeds[index] = { ...newMeds[index], [field]: value };
        setEditMeds(newMeds);
    };

    const handleAddMed = () => {
        if (newMedInput.name.trim()) {
            setEditMeds([...editMeds, { ...newMedInput, name: newMedInput.name.trim() }]);
            setNewMedInput({ name: '', dose: '', frequency: '', quantity: '' });
        }
    };

    const checkIsKnown = (medName) => {
        if (!medName) return false;
        return patientMeds.some(pm => {
            const pmName = (pm.medication_name || pm.name || '').toLowerCase();
            const reqName = medName.toLowerCase();
            return pmName.includes(reqName) || reqName.includes(pmName);
        });
    };

    return {
        requests,
        loading,
        selectedRequest,
        setSelectedRequest,
        actionModal,
        setActionModal,
        actionNote,
        setActionNote,
        activeTab,
        setActiveTab: handleTabChange,
        recycleRequests,
        doctors,
        filter,
        setFilter: handleFilterChange,
        canDeleteRequest,
        handleRestore,
        openActionModal,
        confirmAction,
        handleDelete,
        fetchRequests,
        patientMeds, fetchingMeds,
        isEditing, setIsEditing,
        editMeds, setEditMeds,
        editNotes, setEditNotes,
        newMedInput, setNewMedInput,
        addToChronic, handleSaveEdit,
        updateEditMed, handleAddMed,
        editDoctorNote, setEditDoctorNote,
        checkIsKnown,
        // Pagination Props
        currentPage,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        totalCount,
        handlePageChange,
        t
    };
};
