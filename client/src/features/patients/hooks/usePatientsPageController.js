import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useConfig } from '@/context/ConfigContext';
import { useSearch } from '@/hooks/useSearch';
import { usePatientsHandlers } from '@/features/patients/hooks/usePatientsHandlers';
import { useFetch } from '@/hooks/useFetch';
import { useModal } from '@/context/ModalContext';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { useUsers } from '@/features/users/hooks/useUsers';
import { usePatientQuery } from '@/features/patients/hooks/usePatientQuery';

/**
 * usePatientsPageController (Orchestrator).
 * Main controller for the Patients feature.
 * Coordinates data fetching, filtering, pagination, and various modals using useFetch.
 */
export const usePatientsPageController = () => {
    // Router & URL State
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const urlPatientId = searchParams.get('id');

    // Contexts & Hooks
    const { isStaff, user } = usePermissions();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { settings } = useConfig();
    const { confirm, prompt } = useModal();
    const { viewDoctorId, setViewDoctorId } = useDoctors();
    const { savePrescription } = useAppointments();
    const { deleteUser } = useUsers();
    const { searchTerm, setSearchTerm } = useSearch();

    // View State (Pagination)
    const [itemsPerPage] = useState(50);
    const activeTab = searchParams.get('tab') === 'recycle' ? 'recycle' : 'list';

    const setActiveTab = useCallback((tab) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (tab === 'recycle') {
                next.set('tab', 'recycle');
            } else {
                next.delete('tab');
            }
            return next;
        });
    }, [setSearchParams]);

    const { 
        patients, 
        setPatients,
        totalCount, 
        totalPages, 
        currentPage, 
        handlePageChange,
        loading: patientsLoading, 
        hasFetchedOnce,
        executeSearch,
        refetch: fetchPatients,
    } = usePatientQuery({
        limit: itemsPerPage,
        doctorId: null,
        useGlobalSearch: true
    });

    // Supplementary Lists
    const { data: doctorsData = {} } = useFetch('/users/doctors', { initialData: { success: true, data: { doctors: [] } } });
    const { data: insurancesData = {} } = useFetch('/insurances', { initialData: { success: true, data: { insurances: [] } } });
    const { data: institutionsData = {} } = useFetch('/institutions', { initialData: { success: true, data: { institutions: [] } } });

    const doctors = doctorsData?.data?.doctors || doctorsData?.doctors || [];
    const insurances = insurancesData?.data?.insurances || insurancesData?.insurances || [];
    const institutions = institutionsData?.data?.institutions || institutionsData?.institutions || [];
    const { data: recycleData = [], refetch: fetchRecycleBin } = useFetch('/logs/recycle-bin', { 
        initialData: [],
        immediate: isStaff // only fetch if user is staff
    });
    const recycleItems = Array.isArray(recycleData) ? recycleData : (recycleData?.data || []);

    // Details View State
    const selectedPatientId = urlPatientId || null;
    const [patientDetails, setPatientDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Modals State
    const [editModal, setEditModal] = useState({ open: false, data: {} });
    const [debtModal, setDebtModal] = useState({ open: false, params: { patientId: null, amount: '', method: 'cash' } });
    const [prescribeModal, setPrescribeModal] = useState({ open: false, data: { apptId: null, patientId: null, patientName: '', medications: '', instructions: '' } });
    const [qrModal, setQrModal] = useState({ open: false, url: '', expiry: null, patientName: '', patientPhone: '' });
    const [behaviorRatingModal, setBehaviorRatingModal] = useState({ open: false, patient: null });

    const handleBackToList = useCallback(() => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('id');
                return next;
            });
        }
    }, [navigate, setSearchParams]);

    const handleOpenDetails = useCallback((id) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('id', id);
            return next;
        });
    }, [setSearchParams]);

    const setSelectedPatientId = useCallback((id) => {
        if (id) {
            handleOpenDetails(id);
        } else {
            handleBackToList();
        }
    }, [handleOpenDetails, handleBackToList]);

    // --- Handlers Hook ---
    const hookHandlers = usePatientsHandlers({
        t, showMessage, confirm, prompt, deleteUser, settings,
        patients, patientDetails,
        setPatients,
        setPatientDetails, setSelectedPatientId, setDetailsLoading,
        setEditModal, setDebtModal, setQrModal, setPrescribeModal, 
        setBehaviorRatingModal,
        fetchPatients, fetchRecycleBin,
        onCloseDetails: handleBackToList,
    });

    const { handleViewDetails: fetchPatientDetails } = hookHandlers;

    // Fetch patient details when selectedPatientId changes via URL
    useEffect(() => {
        if (selectedPatientId) {
            fetchPatientDetails(selectedPatientId);
        }
    }, [selectedPatientId, fetchPatientDetails]);

    // Prescription (Special case needs savePrescription from appointments hook)
    const handleSavePrescription = useCallback(async () => {
        const { apptId, patientId, medications, instructions } = prescribeModal.data;
        await savePrescription({ apptId, patientId, medications, instructions }, () => {
            setPrescribeModal({ open: false, data: { ...prescribeModal.data, medications: '', instructions: '' } });
        });
    }, [prescribeModal.data, savePrescription]);

    return {
        // State
        user, 
        t, settings,
        patients, 
        totalCount,
        currentPage, totalPages, handlePageChange,
        doctors, insurances, recycleItems, institutions,
        loading: patientsLoading, 
        detailsLoading,
        activeTab, setActiveTab,
        viewDoctorId, setViewDoctorId,
        searchTerm, setSearchTerm, executeSearch,
        selectedPatientId, setSelectedPatientId,
        patientDetails: selectedPatientId ? patientDetails : null, setPatientDetails,

        // Modals
        editModal, setEditModal,
        debtModal, setDebtModal,
        qrModal, setQrModal,
        prescribeModal, setPrescribeModal,
        behaviorRatingModal, setBehaviorRatingModal,

        // Handlers Group
        handlers: {
            ...hookHandlers,
            handleViewDetails: handleOpenDetails,
            handleBackToList,
            fetchPatients, fetchRecycleBin,
            handleSavePrescription,
        },
        fetched: hasFetchedOnce || (patientsLoading === false && patients !== undefined),
    };

};

