import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { capitalizeWords } from '../utils/stringUtils';

/**
 * Controller hook for the Register page.
 * Manages user registration state and form data.
 */
export const useRegisterController = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        dni: '',
        role: 'patient',
        phone: '',
        specialty: '',
        cbu: '',
        dob: '',
        address: '',
        medicalHistory: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (['fullName', 'address'].includes(name)) {
            value = capitalizeWords(value);
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await register(formData);
            if (result && result.success !== false) {
                navigate('/dashboard');
            } else {
                setError(result?.message || 'Error al registrar usuario. Intente nuevamente.');
            }
        } catch (err) {
            console.error("[RegisterController] Error during registration:", err);
            setError('Error técnico al intentar el registro.');
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        handleChange,
        handleSubmit,
        error,
        loading,
        t
    };
};
