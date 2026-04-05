import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { useMessage } from '../../../context/MessageContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useModal } from '../../../context/ModalContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractMedicationDetails } from '../../../utils/medicationHelpers';

/**
 * Controller hook for the Medical Documents Manager.
 * Orchestrates the listed requests, history, and recycle bin.
 */
export const useRequirementManagerController = (user) => {
    // State
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');
    const [activeTab, setActiveTab] = useState('list'); // 'new' | 'list' | 'recycle'
    const [recycleRequests, setRecycleRequests] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [filter, setFilter] = useState('active'); // 'active' | 'history'

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [itemsPerPage] = useState(25);

    // Medication/Edit State
    const [patientMeds, setPatientMeds] = useState([]);
    const [fetchingMeds, setFetchingMeds] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editMeds, setEditMeds] = useState([]);
    const [editNotes, setEditNotes] = useState('');
    const [editDoctorNote, setEditDoctorNote] = useState('');
    const [newMedInput, setNewMedInput] = useState({ name: '', dose: '', frequency: '', quantity: '' });

    // Contexts
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { doubleConfirm, confirm } = useModal();

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const statusFilter = filter === 'active' ? ['pending', 'consult'] : ['completed', 'rejected'];
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                status: statusFilter
            };
            const res = await api.get('/medical/requests', { params });
            setRequests(res.data.requests || []);
            setTotalCount(res.data.totalCount || 0);
        } catch (err) {
            console.error("[RequirementManagerController] Failed to fetch requests", err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [filter, currentPage, itemsPerPage]);

    const fetchDoctors = useCallback(async () => {
        try {
            const res = await api.get('/users/doctors');
            setDoctors(res.data);
        } catch (err) {
            console.error("[RequirementManagerController] Failed to fetch doctors", err);
        }
    }, []);

    const fetchRecycleBin = useCallback(async () => {
        if (!['admin', 'secretary'].includes(user?.role)) return;
        try {
            const res = await api.get('/logs/recycle-bin');
            setRecycleRequests(res.data.filter(item => item.entity_type === 'medical_request'));
        } catch (err) {
            console.error("[RequirementManagerController] Failed to fetch recycle bin", err);
        }
    }, [user?.role]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    useEffect(() => {
        const interval = setInterval(fetchRequests, 15000);
        return () => clearInterval(interval);
    }, [fetchRequests]);

    useEffect(() => {
        if (activeTab === 'recycle') {
            fetchRecycleBin();
        }
    }, [activeTab, fetchRecycleBin]);

    useEffect(() => {
        if (selectedRequest) {
            setIsEditing(false);
            const { meds, notes } = extractMedicationDetails(selectedRequest);
            setEditMeds(meds);
            setEditNotes(notes);
            setEditDoctorNote(selectedRequest.doctor_note || '');

            if (selectedRequest.patient_id) {
                fetchPatientMeds(selectedRequest.patient_id);
            } else {
                setPatientMeds([]);
            }
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

    const fetchPatientMeds = async (patientId) => {
        setFetchingMeds(true);
        try {
            const res = await api.get(`/medical/patients/${patientId}/medications`);
            setPatientMeds(res.data || []);
        } catch (err) {
            console.error("Error fetching patient meds:", err);
            setPatientMeds([]);
        } finally {
            setFetchingMeds(false);
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
            fetchPatientMeds(selectedRequest.patient_id);
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

    const { canDeleteRequest } = usePermissions();

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
