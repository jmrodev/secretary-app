import { useState } from 'react';
import { useAuth } from '../features/auth';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

/**
 * Controller hook for the Login page.
 * Manages authentication and login state.
 */
export const useLoginController = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(username, password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message || t('invalid_credentials'));
            }
        } catch (err) {
            console.error("[LoginController] Error during login:", err);
            setError(t('error_occurred') || 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return {
        username, setUsername,
        password, setPassword,
        error, loading,
        handleSubmit,
        t
    };
};
