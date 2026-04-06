import { useState, useMemo, useCallback } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import { useMessage } from '../../../context/MessageContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useConfig } from '../../../context/ConfigContext';
import { useModal } from '../../../context/ModalContext';
import { useAppointments } from '../../appointments';
import { useUsers } from '../../users';
import { usePatientsHandlers } from './usePatientsHandlers';
import { useFetch } from '../../../hooks/useFetch';

/**
 * usePatientsPageController (Orchestrator).
 * Main controller for the Patients feature.
 * Coordinates data fetching, filtering, pagination, and various modals using useFetch.
 */
export const usePatientsPageController = () => {
    // Contexts & Hooks
    const { isStaff } = usePermissions();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { settings } = useConfig();
    const { confirm } = useModal();
    const { savePrescription } = useAppointments();
    const { deleteUser } = useUsers();

    // View State (Pagination)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'recycle'
    const [searchTerm, setSearchTerm] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('search') || '';
    });

    // --- FETCH DATA (Server-Side) using useFetch ---
    
    // Main Patients Data
    const { 
        data: patientData = { patients: [], totalCount: 0 }, 
        loading: patientsLoading, 
        refetch: fetchPatients 
    } = useFetch('/users/patients', {
        params: {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm
        }
    });

    const patients = patientData.patients || [];
    const totalCount = patientData.totalCount || 0;

    // Supplementary Lists
    const { data: doctors = [] } = useFetch('/users/doctors', { initialData: [] });
    const { data: insurances = [] } = useFetch('/insurances', { initialData: [] });
    const { data: institutions = [] } = useFetch('/institutions', { initialData: [] });
    const { data: recycleItems = [], refetch: fetchRecycleBin } = useFetch('/logs/recycle-bin', { 
        initialData: [],
        immediate: isStaff // only fetch if user is staff
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
        setPatients: () => fetchPatients(), // Use fetchPatients instead of manual setPatients if possible
        setPatientDetails, setSelectedPatientId, setDetailsLoading,
        setEditModal, setDebtModal, setQrModal, setPrescribeModal, 
        fetchPatients, fetchRecycleBin,
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
        user: usePermissions().user, 
        t, settings,
        patients, 
        totalCount,
        currentPage, totalPages, handlePageChange,
        doctors, insurances, recycleItems, institutions,
        loading: patientsLoading, 
        detailsLoading,
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

