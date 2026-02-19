import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';

export const useMedicalRecords = (patientId, showMessage, t) => {
    const [medications, setMedications] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [pendingMedications, setPendingMedications] = useState([]);

    const fetchMedications = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const res = await api.get(`/medical/patients/${patientId}/medications`);
            setMedications(res.data);

            const reqRes = await api.get(`/medical/requests?patientId=${patientId}`);
            setRecentRequests(reqRes.data.filter(r => r.type === 'prescription'));

        } catch (err) {
            console.error("Error fetching patient meds:", err);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchMedications();
    }, [fetchMedications]);

    const calculateRefillDate = (units, daily, boxes = 1) => {
        if (!units || !daily || isNaN(daily) || Number(daily) <= 0 || isNaN(units)) return null;

        const totalUnits = Number(units) * Number(boxes || 1);
        const daysLasting = Math.floor(totalUnits / Number(daily));
        const date = new Date();
        date.setDate(date.getDate() + daysLasting);
        return date.toISOString().split('T')[0];
    };

    const handleSaveMedications = async () => {
        if (pendingMedications.length === 0) {
            showMessage(t('no_medications_to_add') || 'No hay medicamentos para agregar', 'warning');
            return;
        }

        try {
            for (const med of pendingMedications) {
                await api.post('/medical/patients/medications', {
                    ...med,
                    patient_id: patientId
                });
            }

            showMessage(
                t('medications_added') || `${pendingMedications.length} medicamento(s) agregado(s)`,
                'success'
            );

            setIsAdding(false);
            setPendingMedications([]);
            fetchMedications();
        } catch (err) {
            showMessage(t('error_adding_medication') || 'Error al agregar medicamento', 'error');
        }
    };

    const handleDiscontinue = async (id) => {
        if (!window.confirm(t('confirm_discontinue_med') || '¿Descontinuar este medicamento?')) return;
        try {
            await api.delete(`/medical/patients/medications/${id}`);
            showMessage(t('medication_discontinued') || 'Medicamento descontinuado', 'success');
            fetchMedications();
        } catch (err) {
            showMessage(t('error_discontinuing_med') || 'Error al descontinuar', 'error');
        }
    };

    const handleAddToPending = (med) => {
        setPendingMedications(prev => [...prev, med]);
    };

    const handleRemovePending = (index) => {
        setPendingMedications(prev => prev.filter((_, i) => i !== index));
    };

    return {
        medications,
        recentRequests,
        loading,
        isAdding,
        setIsAdding,
        pendingMedications,
        setPendingMedications,
        fetchMedications,
        handleSaveMedications,
        handleDiscontinue,
        handleAddToPending,
        handleRemovePending,
        calculateRefillDate
    };
};
