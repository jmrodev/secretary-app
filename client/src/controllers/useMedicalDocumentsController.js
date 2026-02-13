
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { isToday } from '../utils/time';
import { usePermissions } from '../hooks/usePermissions';
import { useMedicalDocumentsHandlers } from '../hooks/useMedicalDocumentsHandlers';

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
            const res = await api.get('/medical/requests');
            const sorted = res.data.sort((a, b) => {
                const topStatus = ['pending', 'consult'];
                const aTop = topStatus.includes(a.status);
                const bTop = topStatus.includes(b.status);
                if (aTop && !bTop) return -1;
                if (!aTop && bTop) return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });
            setRequests(sorted);
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
                api.get('/medical/prescriptions'),
                api.get('/medical/licenses')
            ]);
            setPrescriptions(pRes.data);
            setLicenses(lRes.data);
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
    }, [activeTab]);

    useEffect(() => {
        if (selectedDoctor) {
            localStorage.setItem('last_selected_doctor_id', selectedDoctor);
        }
    }, [selectedDoctor]);

    const [printData, setPrintData] = useState([]);

    // --- Handlers Hook ---
    const hookHandlers = useMedicalDocumentsHandlers({
        user, t, showMessage, confirm, doubleConfirm, canDeleteRequest,
        reqType, selectedPatient, selectedDoctor, reqNote, sendToDoctor,
        selectedFile, filePatient, fileDesc, fileToDelete, editData, licenseEditData,
        requestEditData, selectedPrescription, selectedLicense, selectedRequest,
        setReqNote, setSendToDoctor, setFiles, setRequests, setPrescriptions,
        setLicenses, setFileDesc, setSelectedFile, setFileToDelete, setIsSubmitting,
        setIsEditing, setSelectedPrescription, setSelectedLicense, setSelectedRequest,
        setEditData, setLicenseEditData, setRequestEditData, setActionModal, setPaymentModal,
        fetchRequests, fetchFiles, fetchHistory,
    });

    const handlers = {
        ...hookHandlers,
        handleSearchChange: (val) => setSearchTerm(val),
        handleTabChange: (val) => setActiveTab(val),
        handleSubTabChange: (val) => setRequestsSubTab(val),
        handleFileDescChange: (val) => setFileDesc(val),
        handleFilePatientChange: (val) => setFilePatient(val),
        handleFileUploadChange: (file) => setSelectedFile(file),
        handleActionNoteChange: (val) => setActionNote(val),
        handleEditDataChange: (field, val) => setEditData(prev => ({ ...prev, [field]: val })),
        handleLicenseEditDataChange: (field, val) => setLicenseEditData(prev => ({ ...prev, [field]: val })),
        handleRequestEditDataChange: (field, val) => setRequestEditData(prev => ({ ...prev, [field]: val })),
        handleSelectMedication: (med) => {
            setEditData(prev => {
                const current = prev.medications.trim();
                const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
                return { ...prev, medications: newValue };
            });
        },
        toggleEditing: (val) => {
            setIsEditing(val);
            if (!val) {
                setSelectedPrescription(null);
                setSelectedLicense(null);
                setSelectedRequest(null);
            }
        },
        closeActionModal: () => setActionModal({ open: false, type: '', id: null }),
        openActionModal: (type, id) => setActionModal({ open: true, type, id }),
        closePaymentModal: () => setPaymentModal(prev => ({ ...prev, open: false })),
        openPaymentModal: (data) => setPaymentModal({ open: true, ...data }),
        closeDeleteFileModal: () => setFileToDelete(null),
        openDeleteFileModal: (f) => setFileToDelete(f),
        handlePrintPrescriptions: () => hookHandlers.handlePrintPrescriptions(setPrintData),
        filterItem
    };

    return {
        // State
        user, t, showMessage, activeTab, setActiveTab, requestsSubTab, setRequestsSubTab,
        searchTerm, setSearchTerm, isSubmitting, isEditing, setIsEditing,
        requests, files, prescriptions, licenses, doctors,
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
        ...hookHandlers,
        printData,
        handlers
    };
};
