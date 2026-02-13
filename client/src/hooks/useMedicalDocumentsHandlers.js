
import { useCallback } from 'react';
import api from '../api/axios';
import { isToday } from '../utils/time';

export const useMedicalDocumentsHandlers = ({
    // Contexts/External
    user,
    t,
    showMessage,
    confirm,
    doubleConfirm,
    canDeleteRequest,

    // Data/State Access
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

    // Setters
    setReqNote,
    setSendToDoctor,
    setFiles,
    setRequests,
    setPrescriptions,
    setLicenses,
    setFileDesc,
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

    // Actions
    fetchRequests,
    fetchFiles,
    fetchHistory,
}) => {

    const handleCreateRequest = useCallback(async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patient_id: selectedPatient,
                doctor_id: user.role === 'doctor' ? (user.user_id || user.id) : selectedDoctor,
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
            fetchRequests();
            showMessage(t('status_updated'), 'success');
        } catch (err) {
            showMessage(t('update_failed'), 'error');
        }
    }, [t, showMessage, fetchRequests]);

    const handleFileUpload = useCallback(async (e) => {
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

    const handleDeleteRequest = useCallback(async (id, r) => {
        if (user.role !== 'admin' && !canDeleteRequest && (r.status === 'completed' || r.status === 'rejected')) {
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
            setEditData({
                medications: item.medications || '',
                instructions: item.instructions || ''
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
            setRequestEditData({
                request_note: item.request_note || '',
                doctor_note: item.doctor_note || ''
            });
        }
    }, [setIsEditing, setSelectedPrescription, setEditData, setSelectedLicense, setLicenseEditData, setSelectedRequest, setRequestEditData]);

    return {
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
        handlePrintPrescriptions,
        handleEditItem,
        fetchRequests,
    };
};
