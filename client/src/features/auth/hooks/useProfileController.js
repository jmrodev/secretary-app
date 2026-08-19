import { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Profile Controller (Auth Feature Hook).
 * Manages state and logic for editing the currently authenticated user's profile.
 */
export const useProfileController = () => {
    const { user, isAdmin, isDoctor, isPatient, isSecretary, isStaff } = usePermissions();
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    const [loading, setLoading] = useState(true);

    // Form data synchronized with profile record
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumbers: [],
        medicalHistory: '',
        dni: '',
    });

    // react-doctor-disable-next-line react-doctor/no-set-state-after-await-in-effect
    useEffect(() => {
        let isCurrent = true;
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/profile');
                if (res.data && isCurrent) {
                    setFormData({
                        fullName: res.data.full_name || '',
                        phoneNumbers: res.data.phoneNumbers || (res.data.phone ? [{ phone_number: res.data.phone, is_primary: true, label: 'Celular' }] : []),
                        medicalHistory: res.data.medical_history || '',
                        dni: res.data.dni || '',
                    });
                }
            } catch (err) {
                console.error(err);
                if (isCurrent) showMessage("Error loading profile", "error");
            } finally {
                if (isCurrent) setLoading(false);
            }
        };
        fetchProfile();

        return () => { isCurrent = false; };
    }, [showMessage]);

    /**
     * Updates local form state before submission
     */
    const handleProfileChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    /**
     * Persists profile changes to the backend
     */
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/users/profile', {
                full_name: formData.fullName,
                phoneNumbers: formData.phoneNumbers,
                medical_history: formData.medicalHistory,
                dni: formData.dni,
            });
            showMessage(t('profile_updated'), 'success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            showMessage(t('failed_update_profile'), 'error');
            console.error(err);
        }
    };

    const handlers = {
        handleProfileChange,
        handleUpdate,
    };

    return {
        user,
        t,
        loading,
        formData,
        handlers,
        isAdmin, isDoctor, isPatient, isSecretary, isStaff
    };
};
