import React from 'react';
import { useLoginController } from '../controllers/useLoginController';
import Button from '../components/atoms/Button';

/**
 * Login Page Component.
 * Optimized for clarity and performance using BEM and Controller patterns.
 */
const Login = () => {
    const {
        username, setUsername,
        password, setPassword,
        error, loading,
        handleSubmit,
        t
    } = useLoginController();

    return (
        <div className="auth-layout auth-layout--hero">
            <div className="auth-layout__overlay"></div>

            <main className="auth-card">
                <header className="auth-card__header">
                    <h1 className="auth-card__title">{t('welcome_back')}</h1>
                    <p className="auth-card__subtitle">{t('sign_in_subtitle')}</p>
                </header>

                {error && <div className="auth-card__error">{error}</div>}

                <form className="auth-card__form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">{t('username')}</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Usuario"
                            disabled={loading}
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
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Accediendo...' : t('sign_in')}
                    </Button>
                </form>

                <footer className="auth-card__footer">
                    <p className="auth-card__footer-text">
                        © {new Date().getFullYear()} Consultorio Médico.
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default Login;
