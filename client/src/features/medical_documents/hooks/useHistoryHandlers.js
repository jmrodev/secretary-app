import { useCallback } from 'react';
import api from '@/api/axios';

export const useHistoryHandlers = ({
    t,
    showMessage,
    confirm,
    editData,
    licenseEditData,
    selectedPrescription,
    selectedLicense,
    selectedRequest,
    setIsEditing,
    setSelectedPrescription,
    setSelectedLicense,
    setSelectedRequest,
    setEditData,
    setLicenseEditData,
    setRequestEditData,
    fetchHistory,
    handleDeleteRequest,
}) => {
    const handleUpdatePrescription = useCallback(async () => {
        if (!selectedPrescription) return;
        try {
            await api.put(`/medical/prescriptions/${selectedPrescription.id}`, editData);
            showMessage(t('prescription_updated') || 'Receta actualizada', 'success');
            setIsEditing(false);
            fetchHistory();
            setSelectedPrescription(prev => ({ ...prev, ...editData }));
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
            setSelectedLicense(prev => ({ ...prev, ...licenseEditData }));
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [selectedLicense, licenseEditData, t, showMessage, fetchHistory, setIsEditing, setSelectedLicense]);

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

    const handleEditDataChange = useCallback((field, val) => setEditData(prev => ({ ...prev, [field]: val })), [setEditData]);
    const handleLicenseEditDataChange = useCallback((field, val) => setLicenseEditData(prev => ({ ...prev, [field]: val })), [setLicenseEditData]);

    const handleSelectMedication = useCallback((med) => {
        setEditData(prev => {
            const current = (prev.medications || '').trim();
            const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
            return { ...prev, medications: newValue };
        });
    }, [setEditData]);

    return {
        handleUpdatePrescription,
        handleUpdateLicense,
        handleDeletePrescription,
        handleDeleteLicense,
        handleEditItem,
        handleEditDataChange,
        handleLicenseEditDataChange,
        handleSelectMedication
    };
};
