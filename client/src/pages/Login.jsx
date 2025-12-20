import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';

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
        const success = await login(username, password);
        if (success) {
            navigate('/dashboard');
        } else {
            setError(t('invalid_credentials'));
        }
    };

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <h2 className="title" style={{ textAlign: 'center' }}>{t('welcome_back')}</h2>
                <p className="subtitle" style={{ textAlign: 'center' }}>{t('sign_in_subtitle')}</p>

                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">{t('username')}</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('password')}</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        {t('sign_in')}
                    </button>
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <span className="subtitle">{t('no_account')} </span>
                    <Link to="/register" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>{t('register')}</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
