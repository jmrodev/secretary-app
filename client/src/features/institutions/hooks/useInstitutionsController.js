import { useState, useCallback } from 'react';
import { institutionService } from '@/features/institutions/services/institutionService';
import { useMessage } from '@/context/MessageContext';
import { useModal } from '@/context/ModalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { capitalizeWords } from '@/utils/core/stringUtils';
import { useFetch } from '@/hooks/useFetch';

const createInitialFormState = () => ({
    name: '',
    description: '',
    status: 'active',
    base_price: 0,
    phoneNumbers: []
});

export const useInstitutionsController = () => {
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const { t } = useLanguage();

    // Data State using custom hook
    const { data: instData, loading, refetch: fetchInstitutions } = useFetch('/institutions', { 
        initialData: { institutions: [], totalCount: 0 } 
    });

    const institutions = instData?.institutions || [];

    // UI State
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'finances'
    const [editingInstitution, setEditingInstitution] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);

    // Form Initial State
    const [formData, setFormData] = useState(createInitialFormState);

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
            setFormData(createInitialFormState());
        }
        setIsFormModalOpen(true);
    }, []);

    const handleCloseFormModal = useCallback(() => {
        setIsFormModalOpen(false);
        setEditingInstitution(null);
        setFormData(createInitialFormState());
    }, []);

    const handleFormSubmit = useCallback(async (e) => {
        e.preventDefault();
        try {
            if (editingInstitution) {
                await institutionService.updateInstitution(editingInstitution.id, formData);
                showMessage(t('update_success'), 'success');
            } else {
                await institutionService.createInstitution(formData);
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
            await institutionService.deleteInstitution(id);
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
