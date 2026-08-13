import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useFetch } from '@/hooks/useFetch';
import { useSearch } from '@/hooks/useSearch';
import { useDoctors } from '@/context/DoctorContextDefinition';
import api from '@/api/axios';

export const usePrescriptionsController = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { confirm } = useModal();
    const { canDeletePrescription } = usePermissions();
    const { viewDoctorId } = useDoctors();
    const { searchTerm } = useSearch();

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(25);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ medications: '', instructions: '' });
    const [selectedPrescription, setSelectedPrescription] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const {
        data: response,
        loading,
        refetch: fetchHistory
    } = useFetch('/medical/requests', {
        params: {
            page,
            limit,
            type: 'prescription',
            status: 'completed',
            doctorId: viewDoctorId,
            search: debouncedSearch || undefined
        },
        initialData: { success: true, data: [], meta: { totalCount: 0 } },
        immediate: true
    });

    const items = useMemo(() => response?.data || (Array.isArray(response) ? response : []), [response]);
    const totalCount = response?.meta?.totalCount || items.length || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // medical_requests stores medication info in request_note; map to the shape PrescriptionsView expects
    const formattedItems = useMemo(() => {
        return items.map(item => ({
            ...item,
            _origin: 'prescription',
            medications: item.request_note || item.medications || '',
            instructions: item.doctor_note || item.instructions || '',
            title: item.request_note || item.medications || '',
            subtitle: t('prescription'),
            details: item.doctor_note || item.instructions || ''
        }));
    }, [items, t]);

    const handleUpdate = useCallback(async () => {
        if (!selectedPrescription) return;
        try {
            await api.put(`/medical/requests/${selectedPrescription.id}`, {
                request_note: editData.medications,
                doctor_note: editData.instructions
            });
            showMessage(t('prescription_updated') || 'Receta actualizada', 'success');
            setIsEditing(false);
            fetchHistory();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [selectedPrescription, editData, t, showMessage, fetchHistory]);

    const handleDelete = useCallback(async (id) => {
        if (!await confirm(t('confirm_delete_prescription') || '¿Seguro que desea eliminar esta receta?')) return;
        try {
            await api.delete(`/medical/requests/${id}`);
            showMessage(t('prescription_deleted') || 'Receta eliminada', 'success');
            fetchHistory();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [confirm, t, showMessage, fetchHistory]);

    const handleEditItem = useCallback((item) => {
        if (!item) return;
        setIsEditing(true);
        setSelectedPrescription(item);
        let parsedItems = [];
        try { if (item.raw_medication_data) parsedItems = JSON.parse(item.raw_medication_data); } catch (e) { console.debug(e); }
        setEditData({
            medications: item.request_note || item.medications || '',
            instructions: item.doctor_note || item.instructions || '',
            items: parsedItems,
            bonified: item.payment_status === 'bonified',
            _readOnly: item._readOnly || false
        });
    }, []);

    const handleEditDataChange = useCallback((field, val) => setEditData(prev => ({ ...prev, [field]: val })), []);

    const handleSelectMedication = useCallback((med) => {
        setEditData(prev => {
            const current = (prev.medications || '').trim();
            const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
            return { ...prev, medications: newValue };
        });
    }, []);

    return {
        user, t, loading,
        items: formattedItems,
        canDelete: user?.role === 'admin' || canDeletePrescription,
        page, setPage, totalPages,
        isEditing, setIsEditing,
        selectedPrescription, editData,
        fetchHistory, handleUpdate, handleDelete, handleEditItem,
        handleEditDataChange, handleSelectMedication
    };
};
