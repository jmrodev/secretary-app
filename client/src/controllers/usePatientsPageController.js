import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfig } from '../context/ConfigContext';
import { useModal } from '../context/ModalContext';
import { useAppointments } from '../hooks/useAppointments';
import { useUsers } from '../hooks/useUsers';

export const usePatientsPageController = () => {
    // Contexts & Hooks
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { settings } = useConfig();
    const { confirm } = useModal();
    const { savePrescription } = useAppointments();
    const { deleteUser } = useUsers();

    // Data State
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [insurances, setInsurances] = useState([]);
    const [recycleItems, setRecycleItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // View State
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'recycle'
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreate, setShowCreate] = useState(false);

    // Details View State
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Modals State
    const [editModal, setEditModal] = useState({ open: false, data: {} });
    const [debtModal, setDebtModal] = useState({ open: false, params: { patientId: null, amount: '', method: 'cash' } });
    const [prescribeModal, setPrescribeModal] = useState({ open: false, data: { apptId: null, patientId: null, patientName: '', medications: '', instructions: '' } });
    const [qrModal, setQrModal] = useState({ open: false, url: '', expiry: null, patientName: '', patientPhone: '' });
    const [showRatingInfo, setShowRatingInfo] = useState(false);

    // --- FETCH DATA ---
    // --- FETCH DATA ---
    const fetchPatients = useCallback(async () => {
        try {
            const res = await api.get('/users/patients');
            setPatients(res.data);
        } catch (err) {
            console.error(err);
            showMessage(t('failed_load_patients') || "Error al cargar pacientes", 'error');
        } finally {
            setLoading(false);
        }
    }, [t, showMessage]);

    const fetchDoctors = useCallback(async () => {
        try {
            const res = await api.get('/users/doctors');
            setDoctors(res.data);
        } catch (err) { console.error(err); }
    }, []);

    const fetchInsurances = useCallback(async () => {
        try {
            const res = await api.get('/insurances');
            setInsurances(res.data);
        } catch (err) { console.error(err); }
    }, []);

    const fetchRecycleBin = useCallback(async () => {
        if (user.role !== 'admin' && user.role !== 'secretary') return;
        try {
            const res = await api.get('/logs/recycle-bin');
            setRecycleItems(res.data);
        } catch (err) { console.error(err); }
    }, [user.role]);

    useEffect(() => {
        fetchPatients();
        fetchDoctors();
        fetchInsurances();
        fetchRecycleBin();
    }, [fetchPatients, fetchDoctors, fetchInsurances, fetchRecycleBin]);

    // --- FILTER LOGIC ---
    const filteredPatients = useMemo(() => {
        const normalizeText = (text) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

        // Sort first
        const sortedPatients = [...patients].sort((a, b) => {
            const debtA = Number(a.total_debt) || 0;
            const debtB = Number(b.total_debt) || 0;
            if (debtA > 0 && debtB === 0) return -1;
            if (debtA === 0 && debtB > 0) return 1;
            if (debtA > 0 && debtB > 0) return debtB - debtA;
            return a.full_name.localeCompare(b.full_name);
        });

        // Optimization: if no search, return sorted
        if (!searchTerm) return sortedPatients;

        return sortedPatients.filter(p => {
            // Optimization: Create searchable string once or lazily, but here inline is fine if not excessive
            const searchText = normalizeText(
                [
                    p.full_name, p.first_name, p.last_name, p.dni,
                    p.insurance, p.insurance_name, p.affiliate_number,
                    p.email, p.phone, p.phone?.replace(/[^0-9]/g, '')
                ].filter(Boolean).join(' ')
            );
            const tokens = normalizeText(searchTerm).split(/\s+/).filter(t => t.length > 0);
            return tokens.every(token => searchText.includes(token));
        });
    }, [patients, searchTerm]);

    // --- PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, patients]); // Reset page on filter/data change

    const paginatedPatients = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPatients.slice(start, start + itemsPerPage);
    }, [filteredPatients, currentPage]);

    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [totalPages]);

    // --- ACTIONS ---

    const handleCreate = useCallback(async (formData) => {
        try {
            await api.post('/auth/register', { ...formData, role: 'patient' });
            showMessage(t('patient_created'), 'success');
            setShowCreate(false);
            fetchPatients();
        } catch (err) {
            showMessage(err.response?.data || t('failed_create_patient'), 'error');
        }
    }, [t, showMessage]);

    const handleViewDetails = useCallback(async (id) => {
        try {
            setDetailsLoading(true);
            setSelectedPatientId(id);
            // Clear previous if different
            // Note: We can't access previous state easily here without ref or functional update, 
            // but setting id triggers render anyway. 
            // Ideally we check if (id !== selectedPatientId) inside the function scope, 
            // but selectedPatientId is a dependency if we use it.
            // Let's just set it. 

            const [info, trans, appts] = await Promise.all([
                api.get(`/users/patients/${id}`),
                api.get(`/finances/transactions?patient_id=${id}`),
                api.get(`/appointments?patientId=${id}`)
            ]);
            setPatientDetails({ ...info.data, transactions: trans.data, appointments: appts.data });
        } catch (err) {
            console.error(err);
            showMessage("Failed to load history", 'error');
            setSelectedPatientId(null);
        } finally {
            setDetailsLoading(false);
        }
    }, [showMessage]);

    const handleDeletePatient = useCallback(async (patientData) => {
        if (!patientData?.user_id) return;
        await deleteUser(patientData.user_id, patientData.full_name, {
            useDoubleConfirm: true,
            onSuccess: () => {
                setSelectedPatientId(null);
                setPatientDetails(null);
                fetchPatients();
                fetchRecycleBin();
            }
        });
    }, [deleteUser]);

    const handleEditClick = useCallback((patient) => {
        // ... Logic depends on 'patientDetails' if patient is null, but it's passed as arg usually.
        // If called without arg, it uses patientDetails from closure.
        // To be safe and stable, we'll assume it's passed or check state.
        const data = patient || patientDetails;
        if (!data) return;

        const safeDate = (d) => d && typeof d === 'string' ? d.split('T')[0] : '';
        const safeArray = (arr) => Array.isArray(arr) ? arr : [];

        setEditModal({
            open: true,
            data: {
                id: data.id,
                full_name: data.full_name || '',
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                dni: data.dni || '',
                phone: data.phone || '',
                phoneNumbers: safeArray(data.phoneNumbers).length > 0 ? data.phoneNumbers : (data.phone ? [{ phone_number: data.phone, is_primary: true, label: 'Celular' }] : []),
                insurance_id: data.insurance_id || '',
                affiliate_number: data.affiliate_number || (data.insurance && !data.insurance_id ? data.insurance : '') || '',
                email: data.email || '',
                dob: safeDate(data.dob),
                medical_history: data.medical_history || '',
                tariff_percent: data.tariff_percent || 0,
                tariff_override: data.tariff_override || '',
                assignedDoctors: safeArray(data.assignedDoctors).map(d => d.id || d),
                visit_interval_days: data.visit_interval_days || '',
                prescription_interval_days: data.prescription_interval_days || '',
                next_suggested_visit_date: safeDate(data.next_suggested_visit_date),
                next_suggested_prescription_date: safeDate(data.next_suggested_prescription_date),
                license_expiry_date: safeDate(data.license_expiry_date),
                institution_id: data.institution_id || ''
            }
        });
    }, [patientDetails]);

    const handleUpdatePatient = useCallback((updated) => {
        showMessage(t('patient_updated'), 'success');
        setPatientDetails(prev => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
        setPatients(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        setEditModal({ open: false, data: {} });
    }, [t, showMessage]);

    // Debt
    const handleOpenDebtModal = useCallback((e, patientId, currentDebt) => {
        if (e) e.stopPropagation();
        setDebtModal({ open: true, params: { patientId, amount: currentDebt, method: 'cash' } });
    }, []);

    const handlePayDebt = useCallback(async () => {
        try {
            const { patientId, amount, method } = debtModal.params;
            await api.post('/finances/pay-debt', { patient_id: patientId, amount, method });
            showMessage(t('payment_processed'), 'success');
            setDebtModal(prev => ({ ...prev, open: false }));
            fetchPatients();
            // We need to know if selectedPatientId matches, but checking state here adds dependency.
            // A pattern to avoid extra re-renders on 'selectedPatientId' change is checking only at execution time or ignoring it if fetchPatients updates list anyway.
            // But for updating the details view:
            setSelectedPatientId(current => {
                if (current === patientId) handleViewDetails(patientId);
                return current;
            });
        } catch (err) {
            showMessage(t('payment_failed'), 'error');
        }
    }, [debtModal.params, t, showMessage, handleViewDetails]);

    // Rating
    const handleRatingChange = useCallback(async (patientId, newRating) => {
        try {
            await api.put(`/users/patients/${patientId}`, { behavior_rating: newRating });
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, behavior_rating: newRating } : p));
        } catch (err) { console.error(err); }
    }, []);

    // Toggle New
    const handleToggleNew = useCallback(async (patientId) => {
        try {
            const res = await api.put(`/users/patients/${patientId}/toggle-new`);
            const { is_new_patient, marked_new_at } = res.data;
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, is_new_patient, marked_new_at } : p));
            setPatientDetails(prev => (prev?.id === patientId ? { ...prev, is_new_patient, marked_new_at } : prev));
            showMessage(is_new_patient ? 'Marcado como Nuevo' : 'Desmarcado', 'success');
        } catch (err) { showMessage("Error updating status", 'error'); }
    }, [showMessage]);

    // QR
    const handleGenerateQR = useCallback(async (patientId) => {
        try {
            const res = await api.post('/temp-access/generate', { patientId });
            const baseUrl = settings.public_base_url || window.location.origin;

            const patient = patients.find(p => p.id === patientId);
            const patientName = patient ? patient.full_name : '';
            const patientPhone = patient ? patient.phone : '';

            setQrModal({
                open: true,
                url: `${baseUrl}${res.data.url}`,
                expiry: res.data.expiresAt,
                patientName,
                patientPhone
            });
        } catch (err) { showMessage('Error generating QR', 'error'); }
    }, [settings.public_base_url, showMessage, patients]);

    const handleGeneratePrescriptionLink = useCallback(async (patientId) => {
        try {
            const res = await api.post('/medical/prescription-request/generate', { patientId });
            const baseUrl = settings.public_base_url || window.location.origin;

            const patient = patients.find(p => p.id === patientId);
            const patientName = patient ? patient.full_name : '';
            const patientPhone = patient ? patient.phone : '';

            setQrModal({
                open: true,
                url: `${baseUrl}${res.data.url}`,
                expiry: res.data.expiresAt,
                patientName,
                patientPhone,
                type: 'prescription'
            });
        } catch (err) { showMessage('Error generating prescription link', 'error'); }
    }, [settings.public_base_url, showMessage, patients]);

    // Prescription
    const handleSavePrescription = useCallback(async () => {
        const { apptId, patientId, medications, instructions } = prescribeModal.data;
        await savePrescription({ apptId, patientId, medications, instructions }, () => {
            setPrescribeModal({ open: false, data: { ...prescribeModal.data, medications: '', instructions: '' } });
        });
    }, [prescribeModal.data, savePrescription]);

    return {
        // State
        user, t, settings,
        patients: paginatedPatients, // Return paginated list as 'patients' to view
        totalCount: filteredPatients.length,
        currentPage, totalPages, handlePageChange,
        doctors, insurances, recycleItems,
        loading, detailsLoading,
        activeTab, setActiveTab,
        searchTerm, setSearchTerm,
        showCreate, setShowCreate,
        selectedPatientId, setSelectedPatientId,
        patientDetails, setPatientDetails,
        showRatingInfo, setShowRatingInfo,

        // Modals
        editModal, setEditModal,
        debtModal, setDebtModal,
        qrModal, setQrModal,
        prescribeModal, setPrescribeModal,

        // Handlers
        fetchPatients, fetchRecycleBin,
        handleCreate,
        handleViewDetails,
        handleDeletePatient,
        handleEditClick,
        handleUpdatePatient,
        handleOpenDebtModal,
        handlePayDebt,
        handleRatingChange,
        handleToggleNew,
        handleGenerateQR,
        handleGeneratePrescriptionLink,
        handleSavePrescription,
    };
};
