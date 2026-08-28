import { useState, useCallback, useMemo } from 'react';
import { api } from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useModal } from '@/context/ModalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { capitalizeWords } from '@/utils/core/stringUtils';
import { useFetch } from '@/hooks/useFetch';
import { useSearch } from '@/hooks/useSearch';

const capitalizeFormData = (data) => ({
    ...data,
    name: data.name ? capitalizeWords(data.name) : data.name,
    address_notes: data.address_notes ? capitalizeWords(data.address_notes) : data.address_notes,
    street_name: data.street_name ? capitalizeWords(data.street_name) : data.street_name,
    city: data.city ? capitalizeWords(data.city) : data.city,
    province: data.province ? capitalizeWords(data.province) : data.province,
    country: data.country ? capitalizeWords(data.country) : data.country,
});

export const useInsurancesController = () => {
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const { t } = useLanguage();

    // Data State using custom hook
    const { data: insData, loading, refetch: fetchInsurances } = useFetch('/insurances', { 
        initialData: [] 
    });

    const insurances = useMemo(() => {
        if (!insData) return [];
        if (Array.isArray(insData)) return insData;
        if (Array.isArray(insData.data)) return insData.data;
        if (insData.data && Array.isArray(insData.data.insurances)) return insData.data.insurances;
        if (Array.isArray(insData.insurances)) return insData.insurances;
        return [];
    }, [insData]);

    const { searchTerm, setSearchTerm } = useSearch();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', cuit: '', website: '', email: '', phoneNumbers: [], address_notes: '', status: 'active',
        street_name: '', street_number: '', floor: '', apartment: '', city: 'Tandil', province: 'Buenos Aires', country: 'Argentina'
    });

    // Handlers
    const handleOpenCreate = useCallback(() => {
        setEditingId(null);
        setFormData({
            name: '', cuit: '', website: '', email: '', phoneNumbers: [], address_notes: '', status: 'active',
            street_name: '', street_number: '', floor: '', apartment: '', city: 'Tandil', province: 'Buenos Aires', country: 'Argentina'
        });
        setModalOpen(true);
    }, []);

    const handleOpenEdit = useCallback((ins) => {
        setEditingId(ins.id);
        setFormData({
            name: ins.name,
            cuit: ins.cuit || '',
            website: ins.website || '',
            email: ins.email || '',
            phoneNumbers: ins.phoneNumbers || (ins.phone ? [{ phone_number: ins.phone, is_primary: true, label: 'Celular' }] : []),
            address_notes: ins.address_notes || '',
            street_name: ins.street_name || '',
            street_number: ins.street_number || '',
            floor: ins.floor || '',
            apartment: ins.apartment || '',
            city: ins.city || 'Tandil',
            province: ins.province || 'Buenos Aires',
            country: ins.country || 'Argentina',
            status: ins.status || 'active'
        });
        setModalOpen(true);
    }, []);

    const handleSubmit = useCallback(async () => {
        try {
            if (editingId) {
                await api.put(`/insurances/${editingId}`, formData);
                showMessage(t('update_success'), "success");
            } else {
                await api.post('/insurances', formData);
                showMessage(t('save_success'), "success");
            }
            setModalOpen(false);
            fetchInsurances();
        } catch (err) {
            console.error(err);
            showMessage(t('error_saving'), "error");
        }
    }, [editingId, formData, fetchInsurances, showMessage, t]);

    const handleDelete = useCallback(async (id) => {
        if (!await confirm(t('delete_confirm_msg'))) return;
        try {
            await api.delete(`/insurances/${id}`);
            showMessage(t('delete_success'), "success");
            fetchInsurances();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || t('error_deleting'), "error");
        }
    }, [confirm, fetchInsurances, showMessage, t]);

    // Filter Logic
    const filteredInsurances = useMemo(() => {
        return insurances.filter(ins =>
            ins.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ins.cuit && ins.cuit.includes(searchTerm)) ||
            (ins.website && ins.website.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [insurances, searchTerm]);

    return {
        // State
        filteredInsurances,
        loading,
        searchTerm,
        modalOpen,
        editingId,
        formData,

        // Setters
        setSearchTerm,
        setModalOpen,
        setFormData: (data) => {
            if (typeof data === 'function') {
                setFormData(prev => capitalizeFormData(data(prev)));
            } else {
                setFormData(capitalizeFormData(data));
            }
        },

        // Handlers
        handlers: {
            handleOpenCreate,
            handleOpenEdit,
            handleSubmit,
            handleDelete,
            fetchInsurances
        },
        t
    };
};

