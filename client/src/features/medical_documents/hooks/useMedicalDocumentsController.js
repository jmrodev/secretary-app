import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useFetch } from '@/hooks/useFetch';
import { useMedicalDocumentsHandlers } from '@/features/medical_documents/hooks/useMedicalDocumentsHandlers';

/**
 * useMedicalDocumentsController Hook (Orchestrator).
 * Manages the high-level state and coordinates handlers for the Medical Documents feature.
 */
export const useMedicalDocumentsController = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { confirm, doubleConfirm } = useModal();
    const { canDeletePrescription, canDeleteLicense, canDeleteFile, canDeleteRequest } = usePermissions();

    // --- State ---
    const [activeTab, setActiveTab] = useState('requests'); // requests | files | prescriptions | licenses | certificates
    const [requestsSubTab, setRequestsSubTab] = useState('list'); // new | list
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Pagination State for Requests
    const [requestsPage, setRequestsPage] = useState(1);
    const [requestsLimit] = useState(25);

    // Pagination State for History
    const [prescriptionsPage, setPrescriptionsPage] = useState(1);
    const [prescriptionsLimit] = useState(25);

    const [licensesPage, setLicensesPage] = useState(1);
    const [licensesLimit] = useState(25);

    // --- FETCH DATA using useFetch ---

    // Doctors
    const { data: doctors = [] } = useFetch('/users/doctors', { initialData: [] });

    // Requests
    const { 
        data: requestsData = { requests: [], totalCount: 0 }, 
        loading: requestsLoading, 
        refetch: fetchRequests 
    } = useFetch('/medical/requests', {
        params: {
            page: requestsPage,
            limit: requestsLimit,
            status: requestsSubTab === 'list' ? ['pending', 'consult'] : ['completed', 'rejected']
        },
        initialData: { requests: [], totalCount: 0 }
    });

    const requests = requestsData.requests || [];
    const requestsTotal = requestsData.totalCount || 0;

    // Files
    const { 
        data: files = [], 
        loading: filesLoading, 
        refetch: fetchFiles 
    } = useFetch('/medical/files', { 
        initialData: [],
        immediate: activeTab === 'files'
    });

    // Prescriptions
    const { 
        data: prescriptionsData = { prescriptions: [], totalCount: 0 }, 
        loading: prescriptionsLoading, 
        refetch: fetchPrescriptions 
    } = useFetch('/medical/prescriptions', {
        params: { page: prescriptionsPage, limit: prescriptionsLimit },
        initialData: { prescriptions: [], totalCount: 0 },
        immediate: ['prescriptions', 'history'].includes(activeTab)
    });

    const prescriptions = prescriptionsData.prescriptions || [];
    const prescriptionsTotal = prescriptionsData.totalCount || 0;

    // Licenses
    const { 
        data: licensesData = { licenses: [], totalCount: 0 }, 
        loading: licensesLoading, 
        refetch: fetchLicenses 
    } = useFetch('/medical/licenses', {
        params: { page: licensesPage, limit: licensesLimit },
        initialData: { licenses: [], totalCount: 0 },
        immediate: ['licenses', 'history'].includes(activeTab)
    });

    const licenses = licensesData.licenses || [];
    const licensesTotal = licensesData.totalCount || 0;

    const fetchHistory = () => {
        fetchPrescriptions();
        fetchLicenses();
    };

    const loading = requestsLoading || filesLoading || prescriptionsLoading || licensesLoading;

    // Selection/Edit State
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [selectedLicense, setSelectedLicense] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Form inputs
    const [reqType, setReqType] = useState('prescription');
    const [reqNote, setReqNote] = useState('');
    const [sendToDoctor, setSendToDoctor] = useState(true);
    const [filePatient, setFilePatient] = useState('');
    const [fileDesc, setFileDesc] = useState('');
    const [fileToDelete, setFileToDelete] = useState(null);

    // Action Modal
    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });

    // Edit Data
    const [editData, setEditData] = useState({ medications: '', instructions: '' });
    const [licenseEditData, setLicenseEditData] = useState({ start_date: '', days_duration: '', diagnosis: '' });
    const [requestEditData, setRequestEditData] = useState({ request_note: '', doctor_note: '' });

    // --- Helpers ---
    const normalizeText = (text) => {
        if (!text) return "";
        return String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filterItem = (item) => {
        const term = normalizeText(searchTerm);
        return (
            normalizeText(item.patient_name).includes(term) ||
            normalizeText(item.doctor_name).includes(term) ||
            normalizeText(item.patient_dni).includes(term) ||
            normalizeText(item.patient_address).includes(term) ||
            normalizeText(item.description).includes(term) ||
            normalizeText(item.file_name).includes(term) ||
            normalizeText(item.type).includes(term)
        );
    };

    useEffect(() => {
        if (selectedDoctor) {
            localStorage.setItem('last_selected_doctor_id', selectedDoctor);
        }
    }, [selectedDoctor]);
    const [printData] = useState([]);

    // --- Handlers Hook ---
    const handlers = useMedicalDocumentsHandlers({
        // Context/External
        user, t, showMessage, confirm, doubleConfirm, canDeleteRequest,

        // State Access
        reqType, selectedPatient, selectedDoctor, reqNote, sendToDoctor,
        selectedFile, filePatient, fileDesc, fileToDelete, editData, licenseEditData,
        requestEditData, selectedPrescription, selectedLicense, selectedRequest,
        actionModal, actionNote, paymentModal, searchTerm, activeTab, requestsSubTab,

        // Setters
        setReqNote, setSendToDoctor, setFileDesc, setFilePatient, setSelectedFile, setFileToDelete,
        setIsSubmitting, setIsEditing, setSelectedPrescription, setSelectedLicense,
        setSelectedRequest, setEditData, setLicenseEditData, setRequestEditData,
        setActionModal, setPaymentModal, setSearchTerm, setActiveTab, setRequestsSubTab,
        setActionNote, setRequestsPage, setPrescriptionsPage, setLicensesPage,

        // Actions/Filter
        fetchRequests, fetchFiles, fetchHistory,
        filterItem
    });

    return {
        // State
        user, t, showMessage, activeTab, setActiveTab, requestsSubTab, setRequestsSubTab,
        searchTerm, setSearchTerm, isSubmitting, isEditing, setIsEditing,
        requests, files, prescriptions, licenses, doctors,
        requestsPage, requestsTotal,
        requestsTotalPages: Math.ceil(requestsTotal / requestsLimit),
        prescriptionsPage, prescriptionsTotal,
        prescriptionsTotalPages: Math.ceil(prescriptionsTotal / prescriptionsLimit),
        licensesPage, licensesTotal,
        licensesTotalPages: Math.ceil(licensesTotal / licensesLimit),
        selectedPatient, setSelectedPatient, selectedDoctor, setSelectedDoctor,
        selectedFile, setSelectedFile, selectedPrescription, setSelectedPrescription,
        selectedLicense, setSelectedLicense, selectedRequest, setSelectedRequest,
        reqType, setReqType, reqNote, setReqNote,
        sendToDoctor, setSendToDoctor, filePatient, setFilePatient, fileDesc, setFileDesc,
        fileToDelete, setFileToDelete, actionModal, setActionModal, actionNote, setActionNote,
        paymentModal, setPaymentModal, editData, setEditData, licenseEditData, setLicenseEditData,
        requestEditData, setRequestEditData,
        loading,

        // Permissions
        canDeletePrescription,
        canDeleteLicense,
        canDeleteFile,
        canDeleteRequest,

        // Handlers
        printData,
        handlers
    };
};
