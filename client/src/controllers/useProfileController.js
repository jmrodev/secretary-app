import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';

export const useProfileController = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumbers: [],
        medicalHistory: '',
        dni: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/profile');
                setProfile(res.data);

                if (res.data) {
                    setFormData({
                        fullName: res.data.full_name || '',
                        phoneNumbers: res.data.phoneNumbers || (res.data.phone ? [{ phone_number: res.data.phone, is_primary: true, label: 'Celular' }] : []),
                        medicalHistory: res.data.medical_history || '',
                        dni: res.data.dni || '',
                    });
                }
            } catch (err) {
                console.error(err);
                showMessage("Error loading profile", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();

        // Safety timeout
        const timeoutId = setTimeout(() => {
            setLoading(false);
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, []);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

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

    return {
        user,
        t,
        loading,
        formData,
        handleChange,
        handleUpdate
    };
};
