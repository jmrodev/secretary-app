
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { isToday } from '../utils/time';

export const useMedicalDocumentsController = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { confirm, doubleConfirm } = useModal();
    const location = useLocation();

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
    const [bonified, setBonified] = useState(false);
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
    const [requestEditData, setRequestEditData] = useState({ request_note: '', doctor_note: '', debt_amount: '' });

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

    // --- Handlers ---
    const handleCreateRequest = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patient_id: selectedPatient,
                doctor_id: user.role === 'doctor' ? (user.user_id || user.id) : selectedDoctor,
                request_note: reqNote,
                bonified,
                status: sendToDoctor ? 'pending' : 'completed'
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed') || 'Guardado como Completado'), 'success');
            setReqNote('');
            setBonified(false);
            setSendToDoctor(true);
            fetchRequests();
        } catch (err) {
            const errorMsg = err.response?.data || err.message || t('request_failed');
            showMessage(`${t('request_failed')}: ${errorMsg}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id, status, note = '') => {
        try {
            await api.patch(`/medical/requests/${id}`, { status, doctor_note: note });
            fetchRequests();
            showMessage(t('status_updated'), 'success');
        } catch (err) {
            showMessage(t('update_failed'), 'error');
        }
    };

    const handleFileUpload = async (e) => {
        if (e) e.preventDefault();
        if (!selectedFile || !filePatient) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('patient_id', filePatient);
        formData.append('description', fileDesc);

        try {
            await api.post('/medical/files', formData);
            showMessage(t('file_uploaded'), 'success');
            setFileDesc('');
            setSelectedFile(null);
            fetchFiles();
        } catch (err) {
            showMessage(t('upload_failed'), 'error');
        }
    };

    const confirmFileDelete = async () => {
        if (!fileToDelete) return;
        try {
            await api.delete(`/medical/files/${fileToDelete.id}`);
            showMessage(t('file_deleted') || 'Archivo eliminado correctamente', 'success');
            fetchFiles();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data?.message || err.message}`, 'error');
        } finally {
            setFileToDelete(null);
        }
    };

    const handleUpdatePrescription = async () => {
        if (!selectedPrescription) return;
        try {
            await api.put(`/medical/prescriptions/${selectedPrescription.id}`, editData);
            showMessage(t('prescription_updated') || 'Receta actualizada', 'success');
            setIsEditing(false);
            fetchHistory();
            setSelectedPrescription({ ...selectedPrescription, ...editData });
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const handleUpdateLicense = async () => {
        if (!selectedLicense) return;
        try {
            await api.put(`/medical/licenses/${selectedLicense.id}`, licenseEditData);
            showMessage(t('license_updated') || 'Licencia actualizada', 'success');
            setIsEditing(false);
            fetchHistory();
            setSelectedLicense({ ...selectedLicense, ...licenseEditData });
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const handleUpdateRequest = async () => {
        if (!selectedRequest) return;
        try {
            await api.put(`/medical/requests/${selectedRequest.id}`, requestEditData);
            showMessage(t('request_updated') || 'Solicitud actualizada', 'success');
            setIsEditing(false);
            fetchRequests();
            setSelectedRequest({ ...selectedRequest, ...requestEditData });
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const handleDeleteRequest = async (id, r) => {
        if (user.role !== 'admin' && (r.status === 'completed' || r.status === 'rejected')) {
            if (!isToday(r.completed_at || r.updated_at)) {
                showMessage("Solo administradores pueden eliminar solicitudes finalizadas de días anteriores.", "warning");
                return;
            }
        }

        if (!await doubleConfirm(
            t('confirm_delete') || '¿Seguro que desea eliminar?',
            t('confirm_permanent_delete') || 'Esta acción eliminará el registro permanentemente. ¿Confirmar segunda vez?'
        )) return;
        try {
            await api.delete(`/medical/requests/${id}`);
            showMessage(t('deleted_success') || 'Eliminado correctamente', 'success');
            fetchRequests();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const handleDeletePrescription = async (id) => {
        if (!await confirm(t('confirm_delete_prescription') || '¿Seguro que desea eliminar esta receta?')) return;
        try {
            await api.delete(`/medical/prescriptions/${id}`);
            showMessage(t('prescription_deleted') || 'Receta eliminada', 'success');
            fetchHistory();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    };

    const handleDeleteLicense = async (id) => {
        if (!await confirm(t('confirm_delete_license') || '¿Seguro que desea eliminar esta licencia?')) return;
        try {
            await api.delete(`/medical/licenses/${id}`);
            showMessage(t('license_deleted') || 'Licencia eliminada', 'success');
            fetchHistory();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
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

    useEffect(() => {
        if (location.state?.patientName) setSearchTerm(location.state.patientName);
        if (location.state?.patientId) {
            setSelectedPatient(location.state.patientId);
            setFilePatient(location.state.patientId);
        }
        if (location.state?.tab) setActiveTab(location.state.tab);
    }, [location.state]);

    const handleEditItem = (item) => {
        setIsEditing(true);
        if (item._origin === 'prescription') {
            setSelectedPrescription(item);
            setEditData({ medications: item.medications || '', instructions: item.instructions || '' });
        } else if (item._origin === 'license') {
            setSelectedLicense(item);
            setLicenseEditData({ start_date: item.start_date ? item.start_date.split('T')[0] : '', days_duration: item.days_duration || '', diagnosis: item.diagnosis || '' });
        } else if (item._origin === 'request') {
            setSelectedRequest(item);
            setRequestEditData({
                request_note: item.request_note || '',
                doctor_note: item.doctor_note || '',
                debt_amount: item.debt_amount || ''
            });
        }
    };

    return {
        // State
        user, t, showMessage, activeTab, setActiveTab, requestsSubTab, setRequestsSubTab,
        searchTerm, setSearchTerm, isSubmitting, isEditing, setIsEditing,
        requests, files, prescriptions, licenses, doctors,
        selectedPatient, setSelectedPatient, selectedDoctor, setSelectedDoctor,
        selectedFile, setSelectedFile, selectedPrescription, setSelectedPrescription,
        selectedLicense, setSelectedLicense, selectedRequest, setSelectedRequest,
        reqType, setReqType, reqNote, setReqNote, bonified, setBonified,
        sendToDoctor, setSendToDoctor, filePatient, setFilePatient, fileDesc, setFileDesc,
        fileToDelete, setFileToDelete, actionModal, setActionModal, actionNote, setActionNote,
        paymentModal, setPaymentModal, editData, setEditData, licenseEditData, setLicenseEditData,
        requestEditData, setRequestEditData,

        // Handlers
        filterItem, handleCreateRequest, handleUpdateStatus, handleFileUpload, confirmFileDelete,
        handleUpdatePrescription, handleUpdateLicense, handleUpdateRequest, handleDeleteRequest,
        handleDeletePrescription, handleEditItem, handleDeleteLicense, fetchRequests, fetchFiles, fetchHistory
    };
};
