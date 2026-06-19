import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useFetch } from '@/hooks/useFetch';
import { useSearch } from '@/hooks/useSearch';
import { useMedicalDocumentsHandlers } from './useMedicalDocumentsHandlers';
import { useDoctors } from '@/context/DoctorContextDefinition';

/**
 * ECC-Pattern: useMedicalDocumentsController Hook
 */
export const useMedicalDocumentsController = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { confirm, doubleConfirm } = useModal();
    const { canDeletePrescription, canDeleteLicense, canDeleteFile, canDeleteRequest } = usePermissions();
    const { viewDoctorId } = useDoctors();
    const { searchTerm, setSearchTerm } = useSearch();

    const [activeTab, setActiveTab] = useState('requests');
    const [requestsSubTab, setRequestsSubTab] = useState('list');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [requestsPage, setRequestsPage] = useState(1);
    const [requestsLimit] = useState(25);
    const [prescriptionsPage, setPrescriptionsPage] = useState(1);
    const [prescriptionsLimit] = useState(25);
    const [licensesPage, setLicensesPage] = useState(1);
    const [licensesLimit] = useState(25);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const t = setTimeout(() => setRequestsPage(1), 0);
        return () => clearTimeout(t);
    }, [debouncedSearch]);

    // ECC: Unpack data helper
    const unpack = (response, fallback = []) => response?.data || (Array.isArray(response) ? response : fallback);

    const { data: doctorsResponse = { success: true, data: [] } } = useFetch('/users/doctors', { 
        initialData: { success: true, data: [] } 
    });
    const doctors = useMemo(() => unpack(doctorsResponse), [doctorsResponse]);

    const requestsStatus = useMemo(() => {
        if (activeTab === 'requests') {
            return requestsSubTab === 'list' ? ['pending', 'consult'] : ['completed', 'rejected'];
        }
        return ['completed'];
    }, [activeTab, requestsSubTab]);

    const { 
        data: reqResponse, 
        loading: requestsLoading, 
        refetch: fetchRequests 
    } = useFetch('/medical/requests', {
        params: { page: requestsPage, limit: requestsLimit, status: requestsStatus, search: debouncedSearch || undefined, doctorId: viewDoctorId },
        initialData: { success: true, data: [], meta: { totalCount: 0 } }
    });

    const requests = useMemo(() => unpack(reqResponse), [reqResponse]);
    const requestsTotal = reqResponse?.meta?.totalCount || requests.length || 0;

    const { 
        data: filesResponse, 
        loading: filesLoading, 
        refetch: fetchFiles 
    } = useFetch('/medical/files', { 
        params: { doctorId: viewDoctorId },
        initialData: { success: true, data: [] },
        immediate: activeTab === 'files'
    });
    const files = useMemo(() => unpack(filesResponse), [filesResponse]);

    const { 
        data: prescrResponse, 
        loading: prescriptionsLoading, 
        refetch: fetchPrescriptions 
    } = useFetch('/medical/prescriptions', {
        params: { page: prescriptionsPage, limit: prescriptionsLimit, doctorId: viewDoctorId },
        initialData: { success: true, data: [], meta: { totalCount: 0 } },
        immediate: ['prescriptions', 'history'].includes(activeTab)
    });
    const prescriptions = useMemo(() => unpack(prescrResponse), [prescrResponse]);
    const prescriptionsTotal = prescrResponse?.meta?.totalCount || prescriptions.length || 0;

    const { 
        data: licResponse, 
        loading: licensesLoading, 
        refetch: fetchLicenses 
    } = useFetch('/medical/licenses', {
        params: { page: licensesPage, limit: licensesLimit, doctorId: viewDoctorId },
        initialData: { success: true, data: [], meta: { totalCount: 0 } },
        immediate: ['licenses', 'history'].includes(activeTab)
    });
    const licenses = useMemo(() => unpack(licResponse), [licResponse]);
    const licensesTotal = licResponse?.meta?.totalCount || licenses.length || 0;

    const fetchHistory = () => { fetchPrescriptions(); fetchLicenses(); };
    const loading = requestsLoading || filesLoading || prescriptionsLoading || licensesLoading;

    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedDoctor, _setSelectedDoctor] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const setSelectedDoctor = (id) => { _setSelectedDoctor(id); if (id) localStorage.setItem('last_selected_doctor_id', id); };
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [selectedLicense, setSelectedLicense] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [reqType, setReqType] = useState('prescription');
    const [reqNote, setReqNote] = useState('');
    const [sendToDoctor, setSendToDoctor] = useState(true);
    const [filePatient, setFilePatient] = useState('');
    const [fileDesc, setFileDesc] = useState('');
    const [fileToDelete, setFileToDelete] = useState(null);

    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });

    const [editData, setEditData] = useState({ medications: '', instructions: '' });
    const [licenseEditData, setLicenseEditData] = useState({ start_date: '', days_duration: '', diagnosis: '' });
    const [requestEditData, setRequestEditData] = useState({ request_note: '', doctor_note: '' });

    const normalizeText = (text) => { if (!text) return ""; return String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };

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

    const handlers = useMedicalDocumentsHandlers({
        user, t, showMessage, confirm, doubleConfirm, canDeleteRequest,
        reqType, selectedPatient, selectedDoctor, reqNote, sendToDoctor,
        selectedFile, filePatient, fileDesc, fileToDelete, editData, licenseEditData,
        requestEditData, selectedPrescription, selectedLicense, selectedRequest,
        actionModal, actionNote, paymentModal, searchTerm, activeTab, requestsSubTab,
        setReqNote, setSendToDoctor, setFileDesc, setFilePatient, setSelectedFile, setFileToDelete,
        setIsSubmitting, setIsEditing, setSelectedPrescription, setSelectedLicense,
        setSelectedRequest, setEditData, setLicenseEditData, setRequestEditData,
        setActionModal, setPaymentModal, setSearchTerm, setActiveTab, setRequestsSubTab,
        setActionNote, setRequestsPage, setPrescriptionsPage, setLicensesPage,
        fetchRequests, fetchFiles, fetchHistory, filterItem
    });

    return {
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
        loading, canDeletePrescription, canDeleteLicense, canDeleteFile, canDeleteRequest,
        printData: [],
        handlers
    };
};
