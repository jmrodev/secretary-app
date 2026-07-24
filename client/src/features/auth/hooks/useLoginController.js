import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';

/**
 * Controller hook for the Login form.
 * Manages authentication and login state locally for the Login feature.
 */
export const useLoginController = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, clearError: clearGlobalError } = useAuth();
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

    const handleUsernameChange = (val) => {
        setUsername(val);
        if (error) setError('');
        if (clearGlobalError) clearGlobalError();
    };

    const handlePasswordChange = (val) => {
        setPassword(val);
        if (error) setError('');
        if (clearGlobalError) clearGlobalError();
    };

    const handlers = {
        setUsername: handleUsernameChange,
        setPassword: handlePasswordChange,
        handleSubmit,
    };

    return {
        username,
        password,
        error, loading,
        handlers,
        t
    };
};
