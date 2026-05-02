import { useState, useMemo } from 'react';
import api from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import { useFetch } from '@/hooks/useFetch';

/**
 * useUsers Hook (Feature-based).
 * Manages users list and administrative actions.
 */
export const useUsers = (options = {}) => {
    const { role, excludeRoles = [] } = options;
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { doubleConfirm } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch all users for admin
    const { 
        data: userData, 
        loading, 
        refetch: fetchUsers 
    } = useFetch('/users/admin/users', { 
        initialData: { users: [], totalCount: 0 },
        immediate: true 
    });

    const allUsers = useMemo(() => userData?.users || [], [userData]);

    // Filtered data in-memory (as the backend returns all for admin management)
    const users = useMemo(() => {
        let filtered = allUsers;
        if (role) {
            filtered = filtered.filter(u => u.role === role);
        }
        if (excludeRoles.length > 0) {
            filtered = filtered.filter(u => !excludeRoles.includes(u.role));
        }
        return filtered;
    }, [allUsers, role, excludeRoles]);

    const createUser = async (formData, onSuccess) => {
        try {
            setIsSubmitting(true);
            const payload = { ...formData, fullName: formData.full_name };
            await api.post('/users/admin/users', payload);
            showMessage(t('user_created'), 'success');
            if (onSuccess) onSuccess();
            fetchUsers();
            return { success: true };
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data || t('failed_create_user');
            showMessage(errMsg, 'error');
            return { success: false, error: errMsg };
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateUser = async (id, formData, onSuccess) => {
        try {
            setIsSubmitting(true);
            await api.put(`/users/admin/users/${id}`, formData);
            showMessage(t('user_updated'), 'success');
            if (onSuccess) onSuccess();
            fetchUsers();
            return { success: true };
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data || t('failed_update_user');
            showMessage(errMsg, 'error');
            return { success: false, error: errMsg };
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteUser = async (id, name, options = {}) => {
        const { securityCode, useDoubleConfirm, onSuccess } = options;

        if (useDoubleConfirm) {
            const isConfirmed = await doubleConfirm(
                `¿Estás seguro de que deseas eliminar a ${name}? esta acción moverá sus datos a la Papelera.`,
                `¡AVISO! El usuario ${name} será eliminado del listado activo. ¿Deseas continuar?`
            );
            if (!isConfirmed) return { cancelled: true };
        } else if (securityCode && securityCode !== '1234') {
            showMessage("Invalid Security Code", 'error');
            return { success: false };
        }

        try {
            setIsSubmitting(true);
            await api.delete(`/users/admin/users/${id}`);
            showMessage(t('user_deleted'), 'success');
            if (onSuccess) onSuccess();
            fetchUsers();
            return { success: true };
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data || t('failed_delete_user');
            showMessage(errMsg, 'error');
            return { success: false, error: errMsg };
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetPassword = async (id, newPassword, onSuccess) => {
        try {
            setIsSubmitting(true);
            await api.post(`/users/admin/reset-password/${id}`, { newPassword });
            showMessage(t('password_reset'), 'success');
            if (onSuccess) onSuccess();
            return { success: true };
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data || t('failed_reset_password');
            showMessage(errMsg, 'error');
            return { success: false, error: errMsg };
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        users,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        resetPassword,
        isSubmitting,
        loading
    };
};

/**
 * useDoctors Hook (Feature-based).
 * Specialized hook for fetching medical staff.
 */
export const useDoctors = () => {
    const { data: docData, loading } = useFetch('/users/doctors', { 
        initialData: { doctors: [], totalCount: 0 },
        immediate: true 
    });

    const doctors = useMemo(() => docData?.doctors || [], [docData]);

    return { doctors, loading };
};
