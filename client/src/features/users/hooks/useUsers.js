import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useMessage } from '../../../context/MessageContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useModal } from '../../../context/ModalContext';

export const useUsers = () => {
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { confirm, doubleConfirm } = useModal();
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = async (options = {}) => {
        const { role, excludeRoles = [] } = options;
        try {
            setLoading(true);
            const res = await api.get('/users/admin/users');
            let data = res.data;

            if (role) {
                data = data.filter(u => u.role === role);
            }
            if (excludeRoles.length > 0) {
                data = data.filter(u => !excludeRoles.includes(u.role));
            }

            return data;
        } catch (err) {
            console.error(err);
            showMessage('Error fetching users', 'error');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const createUser = async (formData, onSuccess) => {
        try {
            setIsSubmitting(true);
            const payload = { ...formData, fullName: formData.full_name };
            await api.post('/users/admin/users', payload);
            showMessage(t('user_created'), 'success');
            if (onSuccess) onSuccess();
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
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        resetPassword,
        isSubmitting,
        loading
    };
};

export const useDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (!hasFetched) {
            setHasFetched(true);
            setLoading(true);
            api.get('/users/doctors')
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setDoctors(res.data);
                    }
                })
                .catch(err => console.error("Error fetching doctors:", err))
                .finally(() => setLoading(false));
        }
    }, [hasFetched]);

    return { doctors, loading };
};
