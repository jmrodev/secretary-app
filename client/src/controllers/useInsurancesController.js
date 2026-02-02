import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { useMessage } from '../context/MessageContext';
import { useModal } from '../context/ModalContext';
import { useLanguage } from '../context/LanguageContext';

export const useInsurancesController = () => {
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const { t } = useLanguage();

    // Data State
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', cuit: '', website: '', email: '', phoneNumbers: [], address: '', status: 'active'
    });

    // Fetch Data
    const fetchInsurances = useCallback(async () => {
        try {
            const res = await api.get('/insurances');
            setInsurances(res.data);
        } catch (err) {
            console.error(err);
            showMessage("Failed to fetch insurances", "error");
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    useEffect(() => {
        fetchInsurances();
    }, [fetchInsurances]);

    // Handlers
    const handleOpenCreate = useCallback(() => {
        setEditingId(null);
        setFormData({ name: '', cuit: '', website: '', email: '', phoneNumbers: [], address: '', status: 'active' });
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
            address: ins.address || '',
            status: ins.status || 'active'
        });
        setModalOpen(true);
    }, []);

    const handleSubmit = useCallback(async () => {
        try {
            if (editingId) {
                await api.put(`/insurances/${editingId}`, formData);
                showMessage("Insurance updated", "success");
            } else {
                await api.post('/insurances', formData);
                showMessage("Insurance created", "success");
            }
            setModalOpen(false);
            fetchInsurances();
        } catch (err) {
            console.error(err);
            showMessage("Operation failed", "error");
        }
    }, [editingId, formData, fetchInsurances, showMessage]);

    const handleDelete = useCallback(async (id) => {
        if (!await confirm("Are you sure?")) return;
        try {
            await api.delete(`/insurances/${id}`);
            showMessage("Insurance deleted", "success");
            fetchInsurances();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || "Delete failed", "error");
        }
    }, [confirm, fetchInsurances, showMessage]);

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
        setFormData,

        // Handlers
        handlers: {
            handleOpenCreate,
            handleOpenEdit,
            handleSubmit,
            handleDelete,
        }
    };
};
