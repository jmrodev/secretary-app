
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../auth';
import { useMessage } from '../../../context/MessageContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useModal } from '../../../context/ModalContext';
import { isToday } from '../../../utils/time';
import { usePermissions } from '../../../hooks/usePermissions';
import { useMedicalDocumentsHandlers } from './useMedicalDocumentsHandlers';

/**
 * useMedicalDocumentsController Hook (Orchestrator).
 * Manages the high-level state and coordinates handlers for the Medical Documents feature.
 */
export const useMedicalDocumentsController = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { confirm, doubleConfirm } = useModal();
    const location = useLocation();
    const { canDeletePrescription, canDeleteLicense, canDeleteFile, canDeleteRequest } = usePermissions();

    // --- State ---
    const [activeTab, setActiveTab] = useState('requests'); // requests | files | prescriptions | licenses | certificates
    const [requestsSubTab, setRequestsSubTab] = useState('list'); // new | list
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Pagination State for Requests
    const [requestsPage, setRequestsPage] = useState(1);
    const [requestsTotal, setRequestsTotal] = useState(0);
    const [requestsLimit] = useState(25);

    // Pagination State for History
    const [prescriptionsPage, setPrescriptionsPage] = useState(1);
    const [prescriptionsTotal, setPrescriptionsTotal] = useState(0);
    const [prescriptionsLimit] = useState(25);

    const [licensesPage, setLicensesPage] = useState(1);
    const [licensesTotal, setLicensesTotal] = useState(0);
    const [licensesLimit] = useState(25);

    // Data State
    const [requests, setRequests] = useState([]);
    const [files, setFiles] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [licenses, setLicenses] = useState([]);
    const [doctors, setDoctors] = useState([]);

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

    // --- API Calls ---
    const fetchResources = async () => {
        try {
            const dRes = await api.get('/users/doctors');
            setDoctors(dRes.data);
        } catch (err) { console.error(err); }
    };

    const fetchRequests = async () => {
        try {
            const statusFilter = requestsSubTab === 'list' 
                ? ['pending', 'consult'] 
                : ['completed', 'rejected']; // Just a default, will be overridden by tab logic if needed

            const params = {
                page: requestsPage,
                limit: requestsLimit,
                status: statusFilter
            };
            const res = await api.get('/medical/requests', { params });
            
            // We expect { requests, totalCount } from our new paginated backend
            setRequests(res.data.requests || []);
            setRequestsTotal(res.data.totalCount || 0);
        } catch (err) { console.error(err); }
    };

    const fetchFiles = async () => {
        try {
            const res = await api.get('/medical/files');
            setFiles(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchHistory = async () => {
        try {
            const [pRes, lRes] = await Promise.all([
                api.get('/medical/prescriptions', { params: { page: prescriptionsPage, limit: prescriptionsLimit } }),
                api.get('/medical/licenses', { params: { page: licensesPage, limit: licensesLimit } })
            ]);
            setPrescriptions(pRes.data.prescriptions || []);
            setPrescriptionsTotal(pRes.data.totalCount || 0);
            setLicenses(lRes.data.licenses || []);
            setLicensesTotal(lRes.data.totalCount || 0);
        } catch (err) { console.error(err); }
    };


    // --- Effects ---

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchResources();
            fetchRequests();
        } else if (activeTab === 'files') {
            fetchResources();
            fetchFiles();
        } else if (activeTab === 'history' || ['prescriptions', 'licenses', 'certificates'].includes(activeTab)) {
            fetchHistory();
            fetchRequests(); // Requests needed for combined views
        }
    }, [activeTab, requestsPage, requestsSubTab, prescriptionsPage, licensesPage]);

    useEffect(() => {
        if (selectedDoctor) {
            localStorage.setItem('last_selected_doctor_id', selectedDoctor);
        }
    }, [selectedDoctor]);

    const [printData, setPrintData] = useState([]);

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
        setReqNote, setSendToDoctor, setFiles, setRequests, setPrescriptions,
        setLicenses, setFileDesc, setFilePatient, setSelectedFile, setFileToDelete,
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
