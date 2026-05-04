
import { useCallback } from 'react';
import api from '@/api/axios';

/**
 * Hook that contains specific logic for patient lifecycle actions (CRUD, details, debt, QR).
 * Handles mutations and UI state updates for the patient feature.
 */
export const usePatientsHandlers = ({
    // Contexts/External
    t,
    showMessage,
    confirm,
    deleteUser,
    settings,

    // Data/State Access
    patients,
    patientDetails,

    // Setters
    setPatients,
    setPatientDetails,
    setSelectedPatientId,
    setDetailsLoading,
    setEditModal,
    setDebtModal,
    setQrModal,
    fetchPatients,
    fetchRecycleBin,
}) => {

    const handleViewDetailsAction = useCallback(async (id) => {
        try {
            setDetailsLoading(true);
            setSelectedPatientId(id);

            // Optimized: Only fetch basic details (which now include stats via the extended view)
            const res = await api.get(`/users/patients/${id}`);
            setPatientDetails(res.data);
        } catch (err) {
            console.error(err);
            showMessage(t('failed_load_history') || "Failed to load history", 'error');
            setSelectedPatientId(null);
        } finally {
            setDetailsLoading(false);
        }
    }, [showMessage, setSelectedPatientId, setDetailsLoading, setPatientDetails, t]);


    const handleDeletePatient = useCallback(async (patientData) => {
        if (!patientData?.user_id) return;
        await deleteUser(patientData.user_id, patientData.full_name, {
            useDoubleConfirm: true,
            onSuccess: () => {
                setSelectedPatientId(null);
                setPatientDetails(null);
                fetchPatients();
                fetchRecycleBin();
            }
        });
    }, [deleteUser, setSelectedPatientId, setPatientDetails, fetchPatients, fetchRecycleBin]);

    const handleEditClick = useCallback((patient) => {
        const data = patient || patientDetails;
        if (!data) return;

        const safeDate = (d) => d && typeof d === 'string' ? d.split('T')[0] : '';
        const safeArray = (arr) => Array.isArray(arr) ? arr : [];

        setEditModal({
            open: true,
            data: {
                id: data.id,
                full_name: data.full_name || '',
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                dni: data.dni || '',
                phone: data.phone || '',
                phoneNumbers: safeArray(data.phoneNumbers).length > 0 ? data.phoneNumbers : (data.phone ? [{ phone_number: data.phone, is_primary: true, label: 'Celular' }] : []),
                insurance_id: data.insurance_id || '',
                affiliate_number: data.affiliate_number || '',
                email: data.email || '',
                dob: safeDate(data.dob),
                street_name: data.street_name || '',
                street_number: data.street_number || '',
                floor: data.floor || '',
                apartment: data.apartment || '',
                city: data.city || 'Tandil',
                province: data.province || 'Buenos Aires',
                country: data.country || 'Argentina',
                medical_history: data.medical_history || '',
                tariff_percent: data.tariff_percent || 0,
                tariff_override: data.tariff_override || '',
                assignedDoctors: safeArray(data.assignedDoctors).map(d => d.id || d),
                visit_interval_days: data.visit_interval_days || '',
                prescription_interval_days: data.prescription_interval_days || '',
                next_suggested_visit_date: safeDate(data.next_suggested_visit_date),
                next_suggested_prescription_date: safeDate(data.next_suggested_prescription_date),
                license_expiry_date: safeDate(data.license_expiry_date),
                institution_id: data.institution_id || ''
            }
        });
    }, [patientDetails, setEditModal]);

    const handleUpdatePatient = useCallback((updated) => {
        const isNew = !patients.some(p => p.id === updated.id);
        showMessage(isNew ? t('patient_created') : t('patient_updated'), 'success');

        setPatientDetails(prev => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));

        if (isNew) {
            setPatients(prev => [updated, ...prev]);
        } else {
            setPatients(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        }

        setEditModal({ open: false, data: {} });
    }, [t, showMessage, patients, setPatientDetails, setPatients, setEditModal]);

    const handleOpenDebtModal = useCallback((e, patientId, currentDebt) => {
        if (e) e.stopPropagation();
        setDebtModal({ open: true, params: { patientId, amount: currentDebt, method: 'cash' } });
    }, [setDebtModal]);

    const handleDebtAmountChange = useCallback((val) => {
        setDebtModal(prev => ({ ...prev, params: { ...prev.params, amount: val } }));
    }, [setDebtModal]);

    const handleDebtMethodChange = useCallback((val) => {
        setDebtModal(prev => ({ ...prev, params: { ...prev.params, method: val } }));
    }, [setDebtModal]);

    const handlePayDebt = useCallback(async (debtParams) => {
        try {
            const { patientId, amount, method } = debtParams;
            await api.post('/finances/pay-debt', { patientId, amount, method });
            showMessage(t('payment_processed'), 'success');
            setDebtModal(prev => ({ ...prev, open: false }));
            fetchPatients();

            setSelectedPatientId(current => {
                if (current === patientId) handleViewDetailsAction(patientId);
                return current;
            });
        } catch (err) {
            showMessage(t('payment_failed'), 'error');
        }
    }, [t, showMessage, fetchPatients, setSelectedPatientId, handleViewDetailsAction, setDebtModal]);

    const handleRatingChange = useCallback(async (patientId, newRating) => {
        try {
            await api.put(`/users/patients/${patientId}`, { behavior_rating: newRating });
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, behavior_rating: newRating } : p));
        } catch (err) { console.error(err); }
    }, [setPatients]);

    const handleCycleRating = useCallback((e, patientId, currentRating) => {
        if (e) e.stopPropagation();
        const nextRating = ((currentRating || 5) % 5) + 1;
        handleRatingChange(patientId, nextRating);
    }, [handleRatingChange]);

    const handleToggleNew = useCallback(async (patientId) => {
        try {
            const res = await api.put(`/users/patients/${patientId}/toggle-new`);
            const { is_new_patient, marked_new_at } = res.data;
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, is_new_patient, marked_new_at } : p));
            setPatientDetails(prev => (prev?.id === patientId ? { ...prev, is_new_patient, marked_new_at } : prev));
            showMessage(is_new_patient ? 'Marcado como Nuevo' : 'Desmarcado', 'success');
        } catch (err) { showMessage("Error updating status", 'error'); }
    }, [showMessage, setPatients, setPatientDetails]);

    const handleGenerateQR = useCallback(async (patientId) => {
        try {
            const res = await api.post('/temp-access/generate', { patientId });
            const baseUrl = settings.public_base_url || window.location.origin;

            const patient = patients.find(p => p.id === patientId);
            const patientName = patient ? patient.full_name : '';
            const patientPhone = patient ? patient.phone : '';

            setQrModal({
                open: true,
                url: `${baseUrl}${res.data.url}`,
                expiry: res.data.expiresAt,
                patientName,
                patientPhone
            });
        } catch (err) { showMessage('Error generating QR', 'error'); }
    }, [settings.public_base_url, showMessage, patients, setQrModal]);

    const handleGeneratePrescriptionLink = useCallback(async (patientId) => {
        try {
            const res = await api.post('/medical/prescription-request/generate', { patientId });
            const baseUrl = settings.public_base_url || window.location.origin;

            const patient = patients.find(p => p.id === patientId);
            const patientName = patient ? patient.full_name : '';
            const patientPhone = patient ? patient.phone : '';

            setQrModal({
                open: true,
                url: `${baseUrl}${res.data.url}`,
                expiry: res.data.expiresAt,
                patientName,
                patientPhone,
                type: 'prescription'
            });
        } catch (err) { showMessage('Error generating prescription link', 'error'); }
    }, [settings.public_base_url, showMessage, patients, setQrModal]);

    const handleRestorePatient = useCallback(async (id) => {
        try {
            await api.post(`/users/patients/${id}/restore`);
            showMessage(t('patient_restored') || 'Paciente restaurado', 'success');
            fetchPatients();
            fetchRecycleBin();
        } catch (err) {
            console.error(err);
            showMessage(t('restore_failed') || 'Error al restaurar paciente', 'error');
        }
    }, [t, showMessage, fetchPatients, fetchRecycleBin]);

    return {
        handleViewDetails: handleViewDetailsAction,
        handleDeletePatient,
        handleEditClick,
        handleUpdatePatient,
        handleOpenDebtModal,
        handleDebtAmountChange,
        handleDebtMethodChange,
        handlePayDebt,
        handleRatingChange,
        handleCycleRating,
        handleToggleNew,
        handleGenerateQR,
        handleGeneratePrescriptionLink,
        handleRestorePatient,
        handleNewClick: () => setEditModal({ open: true, data: null }),
    };
};
