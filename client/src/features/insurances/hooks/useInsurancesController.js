import { useState, useCallback, useMemo } from 'react';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useModal } from '@/context/ModalContext';
import { useLanguage } from '@/context/LanguageContext';
import { capitalizeWords } from '@/utils/stringUtils';
import { useFetch } from '@/hooks/useFetch';

export const useInsurancesController = () => {
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const { t } = useLanguage();

    // Data State using custom hook
    const { data: insData, loading, refetch: fetchInsurances } = useFetch('/insurances', { 
        initialData: { insurances: [], totalCount: 0 } 
    });

    const insurances = insData?.insurances || [];

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
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
                showMessage(t('update_success') || "Insurance updated", "success");
            } else {
                await api.post('/insurances', formData);
                showMessage(t('save_success') || "Insurance created", "success");
            }
            setModalOpen(false);
            fetchInsurances();
        } catch (err) {
            console.error(err);
            showMessage(t('error_saving') || "Operation failed", "error");
        }
    }, [editingId, formData, fetchInsurances, showMessage, t]);

    const handleDelete = useCallback(async (id) => {
        if (!await confirm(t('delete_confirm_msg') || "Are you sure?")) return;
        try {
            await api.delete(`/insurances/${id}`);
            showMessage(t('delete_success') || "Insurance deleted", "success");
            fetchInsurances();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || t('error_deleting') || "Delete failed", "error");
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
                setFormData(prev => {
                    const next = data(prev);
                    if (next.name) next.name = capitalizeWords(next.name);
                    if (next.address_notes) next.address_notes = capitalizeWords(next.address_notes);
                    if (next.street_name) next.street_name = capitalizeWords(next.street_name);
                    if (next.city) next.city = capitalizeWords(next.city);
                    if (next.province) next.province = capitalizeWords(next.province);
                    if (next.country) next.country = capitalizeWords(next.country);
                    return next;
                });
            } else {
                const updated = { ...data };
                if (updated.name) updated.name = capitalizeWords(updated.name);
                if (updated.address_notes) updated.address_notes = capitalizeWords(updated.address_notes);
                if (updated.street_name) updated.street_name = capitalizeWords(updated.street_name);
                if (updated.city) updated.city = capitalizeWords(updated.city);
                if (updated.province) updated.province = capitalizeWords(updated.province);
                if (updated.country) updated.country = capitalizeWords(updated.country);
                setFormData(updated);
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

