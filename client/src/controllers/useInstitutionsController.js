import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useMessage } from '../context/MessageContext';
import { useModal } from '../context/ModalContext';
import { useLanguage } from '../context/LanguageContext';
import { capitalizeWords } from '../utils/stringUtils';

export const useInstitutionsController = () => {
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const { t } = useLanguage();

    // Data State
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'finances'
    const [editingInstitution, setEditingInstitution] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);

    // Form Initial State
    const initialFormState = {
        name: '',
        description: '',
        status: 'active',
        base_price: 0,
        phoneNumbers: []
    };
    const [formData, setFormData] = useState(initialFormState);

    // Fetch Data
    const fetchInstitutions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/institutions');
            setInstitutions(res.data);
        } catch (err) {
            console.error(err);
            showMessage('Error al cargar instituciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstitutions();
    }, []);

    // Handlers
    const handleOpenFormModal = useCallback((inst = null) => {
        if (inst) {
            setEditingInstitution(inst);
            setFormData({
                name: inst.name,
                description: inst.description || '',
                status: inst.status,
                base_price: inst.base_price || 0,
                phoneNumbers: inst.phoneNumbers || (inst.phone ? [{ phone_number: inst.phone, is_primary: true, label: 'Celular' }] : [])
            });
        } else {
            setEditingInstitution(null);
            setFormData(initialFormState);
        }
        setIsFormModalOpen(true);
    }, []);

    const handleCloseFormModal = useCallback(() => {
        setIsFormModalOpen(false);
        setEditingInstitution(null);
        setFormData(initialFormState);
    }, []);

    const handleFormSubmit = useCallback(async (e) => {
        e.preventDefault();
        try {
            if (editingInstitution) {
                await api.put(`/institutions/${editingInstitution.id}`, formData);
                showMessage(t('update_success'), 'success');
            } else {
                await api.post('/institutions', formData);
                showMessage(t('save_success'), 'success');
            }
            fetchInstitutions();
            handleCloseFormModal();
        } catch (err) {
            console.error(err);
            showMessage(t('error_saving'), 'error');
        }
    }, [editingInstitution, formData, showMessage, fetchInstitutions, handleCloseFormModal, t]);

    const handleDelete = useCallback(async (id) => {
        if (!await confirm(t('delete_confirm_msg'))) return;
        try {
            await api.delete(`/institutions/${id}`);
            showMessage(t('delete_success'), 'success');
            fetchInstitutions();
        } catch (err) {
            console.error(err);
            showMessage(t('error_deleting') || 'Error al eliminar', 'error');
        }
    }, [confirm, showMessage, fetchInstitutions, t]);

    const handleInputChange = useCallback((field, value) => {
        if (field === 'name' && typeof value === 'string') {
            value = capitalizeWords(value);
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    return {
        // State
        institutions,
        loading,
        activeTab,
        isFormModalOpen,
        editingInstitution,
        formData,

        // Setters
        setActiveTab,

        // Handlers
        handlers: {
            fetchInstitutions,
            handleOpenFormModal,
            handleCloseFormModal,
            handleFormSubmit,
            handleDelete,
            handleInputChange,
        },
        t
    };
};
