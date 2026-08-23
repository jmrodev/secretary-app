import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useFetch } from '@/hooks/useFetch';
import { useSearch } from '@/hooks/useSearch';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { api } from '@/api/axios';

export const useCertificatesController = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { confirm } = useModal();
    const { canDeleteRequest } = usePermissions();
    const { viewDoctorId } = useDoctors();
    const { searchTerm } = useSearch();

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ request_note: '', doctor_note: '', payment_status: 'pending' });
    const [selectedCertificate, setSelectedCertificate] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset to page 1 whenever the debounced search changes. Applied during
    // render so the new page commits before the fetch effect runs.
    const [prevDebouncedSearch, setPrevDebouncedSearch] = useState(debouncedSearch);
    if (prevDebouncedSearch !== debouncedSearch) {
        setPrevDebouncedSearch(debouncedSearch);
        setPage(1);
    }

    const { 
        data: response, 
        loading, 
        refetch: fetchHistory 
    } = useFetch('/medical/requests', {
        params: { page, limit, type: 'certificate', status: 'completed', doctorId: viewDoctorId, search: debouncedSearch || undefined },
        initialData: { success: true, data: [], meta: { totalCount: 0 } },
        immediate: true
    });

    const items = useMemo(() => response?.data || (Array.isArray(response) ? response : []), [response]);
    const totalCount = response?.meta?.totalCount || items.length || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Derived formatting
    const formattedItems = useMemo(() => {
        return items.map(item => ({
            ...item,
            _origin: 'request',
            title: t(item.type),
            subtitle: t('certificate'),
            details: item.request_note || t('no_description')
        }));
    }, [items, t]);

    const handleUpdate = useCallback(async () => {
        if (!selectedCertificate) return;
        try {
            await api.put(`/medical/requests/${selectedCertificate.id}`, editData);
            showMessage(t('request_updated'), 'success');
            setIsEditing(false);
            fetchHistory();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [selectedCertificate, editData, t, showMessage, fetchHistory]);

    const handleDelete = useCallback(async (id) => {
        if (!await confirm(t('confirm_delete_request'))) return;
        try {
            await api.delete(`/medical/requests/${id}`);
            showMessage(t('request_deleted'), 'success');
            fetchHistory();
        } catch (err) {
            showMessage(`${t('error')}: ${err.response?.data || err.message}`, 'error');
        }
    }, [confirm, t, showMessage, fetchHistory]);

    const handleEditItem = useCallback((item) => {
        if (!item) return;
        setIsEditing(true);
        setSelectedCertificate(item);
        let parsedItems = [];
        try { if (item.raw_medication_data) parsedItems = JSON.parse(item.raw_medication_data); } catch (e) { console.debug(e); }
        setEditData({
            request_note: item.request_note || '',
            doctor_note: item.doctor_note || '',
            items: parsedItems,
            payment_status: item.payment_status || 'pending',
            _readOnly: item._readOnly || false
        });
    }, []);

    const handleEditDataChange = useCallback((field, val) => setEditData(prev => ({ ...prev, [field]: val })), []);

    return {
        user, t, loading,
        items: formattedItems,
        canDelete: user?.role === 'admin' || canDeleteRequest,
        page, setPage, totalPages,
        isEditing, setIsEditing,
        selectedCertificate, editData,
        fetchHistory, handleUpdate, handleDelete, handleEditItem,
        handleEditDataChange
    };
};
