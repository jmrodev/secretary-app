import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/context/LanguageContext';
import { useConfig } from '@/context/ConfigContext';
import { useSearch } from '@/context/SearchContext';
import { usePatientsHandlers } from '@/features/patients/hooks/usePatientsHandlers';
import { useFetch } from '@/hooks/useFetch';
import { useModal } from '@/context/ModalContext';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { useUsers } from '@/features/users/hooks/useUsers';

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
    const { viewDoctorId, setViewDoctorId } = useDoctors();
    const { savePrescription } = useAppointments();
    const { deleteUser } = useUsers();
    const { searchTerm, setSearchTerm } = useSearch();

    // View State (Pagination)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'recycle'

    // --- FETCH DATA (Server-Side) using useFetch ---
    
    // Main Patients Data
    const { 
        data: patientData, 
        loading: patientsLoading, 
        refetch: fetchPatients 
    } = useFetch('/users/patients', {
        initialData: { patients: [], totalCount: 0 },
        params: {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            doctor_id: viewDoctorId
        }
    });

    const patients = patientData?.patients || [];
    const totalCount = patientData?.totalCount || 0;

    // Supplementary Lists
    const { data: doctorsData = [] } = useFetch('/users/doctors', { initialData: [] });
    const { data: insurancesData = [] } = useFetch('/insurances', { initialData: [] });
    const { data: institutionsData = [] } = useFetch('/institutions', { initialData: [] });

    const doctors = doctorsData?.doctors || [];
    const insurances = insurancesData?.insurances || [];
    const institutions = institutionsData?.institutions || [];
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
        viewDoctorId, setViewDoctorId,
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
        }
    };
};

