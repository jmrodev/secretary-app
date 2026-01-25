import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/atoms/Button';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const { t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(username, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message || t('invalid_credentials'));
        }
    };

    return (
        <div className="home-landing">
            <div className="landing-overlay"></div>
            <div className="card auth-card relative z-10">
                <h2 className="title text-center">{t('welcome_back')}</h2>
                <p className="subtitle text-center">{t('sign_in_subtitle')}</p>

                {error && <div className="text-center text-red mb-4">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="form-label">{t('username')}</label>
                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="form-label">{t('password')}</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" variant="primary" className="w-full">
                        {t('sign_in')}
                    </Button>
                </form>
                {/* Disabling public registration as per user request. Managed by Admin/Secretary. */}
                {/* 
                <div className="mt-6 text-center">
                    <span className="subtitle">{t('no_account')} </span>
                    <Link to="/register" className="link-accent font-bold no-underline">{t('register')}</Link>
                </div>
                */}
            </div>
        </div>
    );
};

export default Login;
