import { useCallback } from 'react';
import api from '@/api/axios';
import { isToday } from '@/utils/core/dateUtils';

/**
 * useMedicalDocumentsHandlers Hook (Executor).
 * Contains all the complex logic for managing medical documents.
 */
export const useMedicalDocumentsHandlers = ({
    // Contexts/External
    user,
    t,
    showMessage,
    confirm,
    doubleConfirm,
    canDeleteRequest,

    // State Access
    reqType,
    selectedPatient,
    selectedDoctor,
    reqNote,
    sendToDoctor,
    selectedFile,
    filePatient,
    fileDesc,
    fileToDelete,
    editData,
    licenseEditData,
    requestEditData,
    selectedPrescription,
    selectedLicense,
    selectedRequest,
    actionModal,
    actionNote,
    paymentModal,
    searchTerm,
    activeTab,
    requestsSubTab,

    // Setters
    setReqNote,
    setSendToDoctor,
    setFileDesc,
    setFilePatient,
    setSelectedFile,
    setFileToDelete,
    setIsSubmitting,
    setIsEditing,
    setSelectedPrescription,
    setSelectedLicense,
    setSelectedRequest,
    setEditData,
    setLicenseEditData,
    setRequestEditData,
    setActionModal,
    setPaymentModal,
    setSearchTerm,
    setActiveTab,
    setRequestsSubTab,
    setActionNote,
    setRequestsPage,
    setPrescriptionsPage,
    setLicensesPage,

    // Actions
    fetchRequests,
    fetchFiles,
    fetchHistory,
    filterItem,
}) => {

    const handleCreateRequest = useCallback(async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patientId: selectedPatient,
                doctor_id: user?.role === 'doctor' ? (user.user_id || user.id) : selectedDoctor,
                request_note: reqNote,
                status: sendToDoctor ? 'pending' : 'completed'
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed') || 'Guardado como Completado'), 'success');
            setReqNote('');
            setSendToDoctor(true);
            fetchRequests();
        } catch (err) {
            const errorMsg = err.response?.data || err.message || t('request_failed');
            showMessage(`${t('request_failed')}: ${errorMsg}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    }, [reqType, selectedPatient, user, selectedDoctor, reqNote, sendToDoctor, t, showMessage, fetchRequests, setIsSubmitting, setReqNote, setSendToDoctor]);

    const handleUpdateStatus = useCallback(async (id, status, note = '') => {
        try {
            await api.patch(`/medical/requests/${id}`, { status, doctor_note: note });
            setActionModal({ open: false, type: '', id: null });
            setSelectedRequest(null);
            setIsEditing(false);
            fetchRequests();
            showMessage(t('status_updated'), 'success');
        } catch (err) {
            showMessage(t('update_failed'), 'error');
        }
    }, [t, showMessage, fetchRequests, setActionModal, setSelectedRequest, setIsEditing]);

    const handleFileUpload = useCallback(async (e) => {
        if (e) e.preventDefault();
        if (!selectedFile || !filePatient) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('patientId', filePatient);
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
    }, [selectedFile, filePatient, fileDesc, t, showMessage, fetchFiles, setFileDesc, setSelectedFile]);

    const confirmFileDelete = useCallback(async () => {
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
    }, [fileToDelete, t, showMessage, fetchFiles, setFileToDelete]);

    const handleUpdatePrescription = useCallback(async () => {
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
    }, [selectedPrescription, editData, t, showMessage, fetchHistory, setIsEditing, setSelectedPrescription]);

    const handleUpdateLicense = useCallback(async () => {
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
    }, [selectedLicense, licenseEditData, t, showMessage, fetchHistory, setIsEditing, setSelectedLicense]);

    const handleUpdateRequest = useCallback(async () => {
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
    }, [selectedRequest, requestEditData, t, showMessage, fetchRequests, setIsEditing, setSelectedRequest]);

    const handleBonifyRequest = useCallback(async (id) => {
        if (!await confirm(t('confirm_bonify') || '¿Seguro que desea marcar como bonificado? Esto cancelará deudas pendientes.')) return;
        try {
            await api.put(`/medical/requests/${id}`, { payment_status: 'bonified' });
            showMessage(t('bonified_success') || 'Carga realizada con bonificación exitosa', 'success');
            fetchRequests();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [t, showMessage, fetchRequests, confirm]);

    const handleDeleteRequest = useCallback(async (id, r) => {
        if (user?.role !== 'admin' && !canDeleteRequest && (r.status === 'completed' || r.status === 'rejected')) {
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
    }, [user, canDeleteRequest, doubleConfirm, t, showMessage, fetchRequests]);

    const handleDeletePrescription = useCallback(async (id, item) => {
        if (item && item._origin === 'request') {
            return handleDeleteRequest(id, item);
        }
        if (!await confirm(t('confirm_delete_prescription') || '¿Seguro que desea eliminar esta receta?')) return;
        try {
            await api.delete(`/medical/prescriptions/${id}`);
            showMessage(t('prescription_deleted') || 'Receta eliminada', 'success');
            fetchHistory();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [handleDeleteRequest, confirm, t, showMessage, fetchHistory]);

    const handleDeleteLicense = useCallback(async (id, item) => {
        if (item && item._origin === 'request') {
            return handleDeleteRequest(id, item);
        }
        if (!await confirm(t('confirm_delete_license') || '¿Seguro que desea eliminar esta licencia?')) return;
        try {
            await api.delete(`/medical/licenses/${id}`);
            showMessage(t('license_deleted') || 'Licencia eliminada', 'success');
            fetchHistory();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [handleDeleteRequest, confirm, t, showMessage, fetchHistory]);

    const handleExportJSON = useCallback(async () => {
        try {
            const response = await api.get('/medical/prescriptions/export/json', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'prescriptions_backup.json');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showMessage(t('export_success') || 'Exportación exitosa', 'success');
        } catch (err) {
            showMessage(t('export_failed') || 'Error al exportar', 'error');
        }
    }, [t, showMessage]);

    const handlePrintPrescriptions = useCallback(async (setPrintData) => {
        try {
            const res = await api.get('/medical/prescriptions/export/json?preview=true');
            setPrintData(res.data);
            setTimeout(() => {
                window.print();
            }, 500);
        } catch (err) {
            showMessage(t('print_error') || 'Error al preparar impresión', 'error');
        }
    }, [t, showMessage]);

    const handleEditItem = useCallback((item) => {
        if (!item) return;

        setIsEditing(true);

        if (item._origin === 'prescription') {
            setSelectedPrescription(item);
            let parsedItems = [];
            try { if (item.raw_medication_data) parsedItems = JSON.parse(item.raw_medication_data); } catch (e) { console.debug(e); }
            setEditData({
                medications: item.medications || '',
                instructions: item.instructions || '',
                items: parsedItems,
                bonified: item.bonified === 1 || item.bonified === true,
                _readOnly: item._readOnly || false
            });
        } else if (item._origin === 'license') {
            setSelectedLicense(item);
            setLicenseEditData({
                start_date: item.start_date ? item.start_date.split('T')[0] : '',
                days_duration: item.days_duration || '',
                diagnosis: item.diagnosis || ''
            });
        } else if (item._origin === 'request') {
            setSelectedRequest(item);
            let parsedItems = [];
            try { if (item.raw_medication_data) parsedItems = JSON.parse(item.raw_medication_data); } catch (e) { console.debug(e); }
            setRequestEditData({
                request_note: item.request_note || '',
                doctor_note: item.doctor_note || '',
                items: parsedItems,
                payment_status: item.payment_status || 'pending',
                _readOnly: item._readOnly || false
            });
        }
    }, [setIsEditing, setSelectedPrescription, setEditData, setSelectedLicense, setLicenseEditData, setSelectedRequest, setRequestEditData]);

    const handleSearchChange = useCallback((val) => setSearchTerm(val), [setSearchTerm]);
    const handleTabChange = useCallback((val) => {
        setActiveTab(val);
        setRequestsPage(1);
        setPrescriptionsPage(1);
        setLicensesPage(1);
    }, [setActiveTab, setRequestsPage, setPrescriptionsPage, setLicensesPage]);

    const handlePrescriptionPageChange = useCallback((val) => setPrescriptionsPage(val), [setPrescriptionsPage]);
    const handleLicensePageChange = useCallback((val) => setLicensesPage(val), [setLicensesPage]);
    const handleSubTabChange = useCallback((val) => {
        setRequestsSubTab(val);
        setRequestsPage(1);
    }, [setRequestsSubTab, setRequestsPage]);

    const handlePageChange = useCallback((val) => setRequestsPage(val), [setRequestsPage]);
    const handleFileDescChange = useCallback((val) => setFileDesc(val), [setFileDesc]);
    const handleFilePatientChange = useCallback((val) => setFilePatient(val), [setFilePatient]);
    const handleFileUploadChange = useCallback((file) => setSelectedFile(file), [setSelectedFile]);
    const handleActionNoteChange = useCallback((val) => setActionNote(val), [setActionNote]);

    const handleEditDataChange = useCallback((field, val) => setEditData(prev => ({ ...prev, [field]: val })), [setEditData]);
    const handleLicenseEditDataChange = useCallback((field, val) => setLicenseEditData(prev => ({ ...prev, [field]: val })), [setLicenseEditData]);
    const handleRequestEditDataChange = useCallback((field, val) => setRequestEditData(prev => ({ ...prev, [field]: val })), [setRequestEditData]);

    const handleSelectMedicationLocal = useCallback((med) => {
        setEditData(prev => {
            const current = (prev.medications || '').trim();
            const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
            return { ...prev, medications: newValue };
        });
    }, [setEditData]);

    const toggleEditing = useCallback((val) => {
        setIsEditing(val);
        if (!val) {
            setSelectedPrescription(null);
            setSelectedLicense(null);
            setSelectedRequest(null);
        }
    }, [setIsEditing, setSelectedPrescription, setSelectedLicense, setSelectedRequest]);

    const closeActionModal = useCallback(() => setActionModal({ open: false, type: '', id: null }), [setActionModal]);
    const openActionModal = useCallback((type, id) => setActionModal({ open: true, type, id }), [setActionModal]);

    const closePaymentModal = useCallback(() => setPaymentModal(prev => ({ ...prev, open: false })), [setPaymentModal]);
    const openPaymentModal = useCallback((data) => setPaymentModal({ open: true, ...data }), [setPaymentModal]);

    const closeDeleteFileModal = useCallback(() => setFileToDelete(null), [setFileToDelete]);
    const openDeleteFileModal = useCallback((f) => setFileToDelete(f), [setFileToDelete]);

    const handlePrintLocal = useCallback((setPrintData) => handlePrintPrescriptions(setPrintData), [handlePrintPrescriptions]);

    return {
        // Core Actions
        handleCreateRequest,
        handleUpdateStatus,
        handleFileUpload,
        confirmFileDelete,
        handleUpdatePrescription,
        handleUpdateLicense,
        handleUpdateRequest,
        handleDeleteRequest,
        handleDeletePrescription,
        handleDeleteLicense,
        handleExportJSON,
        handlePrintPrescriptions: handlePrintLocal,
        handleEditItem,
        fetchRequests,

        // UI Handlers
        handleSearchChange,
        handleTabChange,
        handleSubTabChange,
        handlePageChange,
        handlePrescriptionPageChange,
        handleLicensePageChange,
        handleFileDescChange,
        handleFilePatientChange,
        handleFileUploadChange,
        handleActionNoteChange,
        handleEditDataChange,
        handleLicenseEditDataChange,
        handleRequestEditDataChange,
        handleSelectMedication: handleSelectMedicationLocal,
        toggleEditing,
        closeActionModal,
        openActionModal,
        closePaymentModal,
        openPaymentModal,
        closeDeleteFileModal,
        openDeleteFileModal,
        handleBonifyRequest,
        filterItem
    };
};
