import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../features/auth';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfig } from '../context/ConfigContext';
import { useModal } from '../context/ModalContext';
import { useAppointments } from '../features/appointments';
import { useUsers } from '../hooks/useUsers';
import { usePatientsHandlers } from '../hooks/usePatientsHandlers';

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
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);

    // View State
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'recycle'
    const [searchTerm, setSearchTerm] = useState(() => {
        // Pre-fill search from URL param, e.g. when navigating from institution transactions
        const params = new URLSearchParams(window.location.search);
        return params.get('search') || '';
    });

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

    const fetchInstitutions = useCallback(async () => {
        try {
            const res = await api.get('/institutions');
            setInstitutions(res.data);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        fetchPatients();
        fetchDoctors();
        fetchInsurances();
        fetchRecycleBin();
        fetchInstitutions();
    }, [fetchPatients, fetchDoctors, fetchInsurances, fetchRecycleBin, fetchInstitutions]);

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
            const searchText = normalizeText(
                [
                    p.full_name, p.first_name, p.last_name, p.dni,
                    p.insurance_name, p.affiliate_number,
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


    // --- Handlers Hook ---
    const hookHandlers = usePatientsHandlers({
        t, showMessage, confirm, deleteUser, settings,
        patients, patientDetails,
        setPatients, setPatientDetails, setSelectedPatientId, setDetailsLoading,
        setEditModal, setDebtModal, setQrModal, fetchPatients, fetchRecycleBin,
    });

    // Prescription (Special case needs savePrescription from appointments hook)
    const handleSavePrescription = useCallback(async () => {
        const { apptId, patientId, medications, instructions } = prescribeModal.data;
        await savePrescription({ apptId, patientId, medications, instructions }, () => {
            setPrescribeModal({ open: false, data: { ...prescribeModal.data, medications: '', instructions: '' } });
        });
    }, [prescribeModal.data, savePrescription]);
    // --- RATING HELPERS ---
    const calculateFinancialRating = useCallback((debt) => {
        const d = Number(debt) || 0;
        if (d <= 0) return 5;
        if (d < 1000) return 4;
        if (d < 5000) return 3;
        if (d < 10000) return 2;
        return 1;
    }, []);

    const calculateAttendanceRating = useCallback((total, missed) => {
        if (!total || total === 0) return 5;
        const ratio = (total - missed) / total;
        if (ratio >= 0.95) return 5;
        if (ratio >= 0.85) return 4;
        if (ratio >= 0.70) return 3;
        if (ratio >= 0.50) return 2;
        return 1;
    }, []);

    return {
        // State
        user, t, settings,
        patients: paginatedPatients, // Return paginated list as 'patients' to view
        totalCount: filteredPatients.length,
        currentPage, totalPages, handlePageChange,
        doctors, insurances, recycleItems, institutions,
        loading, detailsLoading,
        activeTab, setActiveTab,
        searchTerm, setSearchTerm,
        selectedPatientId, setSelectedPatientId,
        patientDetails, setPatientDetails,

        // Modals
        editModal, setEditModal,
        debtModal, setDebtModal,
        qrModal, setQrModal,
        prescribeModal, setPrescribeModal,

        // Handlers Group
        handlers: {
            ...hookHandlers,
            fetchPatients, fetchRecycleBin,
            handleSavePrescription,
            calculateFinancialRating,
            calculateAttendanceRating,
        }
    };
};
