
import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/api/axios';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/context/LanguageContext';
import { useConfig } from '@/context/ConfigContext';
import { useModal } from '@/context/ModalContext';
import { useAppointments } from '@/features/appointments';
import { useUsers } from '@/features/users';
import { usePatientsHandlers } from './usePatientsHandlers';

/**
 * usePatientsPageController (Orchestrator).
 * Main controller for the Patients feature.
 * Coordinates data fetching, filtering, pagination, and various modals.
 */
export const usePatientsPageController = () => {
    // Contexts & Hooks
    const { user, isStaff, isAdmin } = usePermissions();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { settings } = useConfig();
    const { confirm } = useModal();
    const { savePrescription } = useAppointments();
    const { deleteUser } = useUsers();

    // Data State
    const [patients, setPatients] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [doctors, setDoctors] = useState([]);
    const [insurances, setInsurances] = useState([]);
    const [recycleItems, setRecycleItems] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);

    // View State (Pagination)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'recycle'
    const [searchTerm, setSearchTerm] = useState(() => {
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

    // --- FETCH DATA (Server-Side) ---
    const fetchPatients = useCallback(async (page = 1, search = '') => {
        try {
            setLoading(true);
            const res = await api.get('/users/patients', {
                params: {
                    page,
                    limit: itemsPerPage,
                    search
                }
            });
            setPatients(res.data.patients);
            setTotalCount(res.data.totalCount);
        } catch (err) {
            console.error(err);
            showMessage(t('failed_load_patients') || "Error al cargar pacientes", 'error');
        } finally {
            setLoading(false);
        }
    }, [t, showMessage, itemsPerPage]);

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
        if (!isStaff) return;
        try {
            const res = await api.get('/logs/recycle-bin');
            setRecycleItems(res.data);
        } catch (err) { console.error(err); }
    }, [isStaff]);

    const fetchInstitutions = useCallback(async () => {
        try {
            const res = await api.get('/institutions');
            setInstitutions(res.data);
        } catch (err) { console.error(err); }
    }, []);

    // Initial Load & Search/Page changes
    useEffect(() => {
        fetchPatients(currentPage, searchTerm);
        fetchDoctors();
        fetchInsurances();
        fetchRecycleBin();
        fetchInstitutions();
    }, [currentPage, searchTerm, fetchDoctors, fetchInsurances, fetchRecycleBin, fetchInstitutions]); // intentionally not adding fetchPatients to avoid double fetch if it changes

    // Reset to page 1 on search
    const handleSearchChange = useCallback((value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, []);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

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
        setEditModal, setDebtModal, setQrModal, setPrescribeModal, fetchPatients, fetchRecycleBin,
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
        patients, 
        totalCount,
        currentPage, totalPages, handlePageChange,
        doctors, insurances, recycleItems, institutions,
        loading, detailsLoading,
        activeTab, setActiveTab,
        searchTerm, setSearchTerm: handleSearchChange,
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
