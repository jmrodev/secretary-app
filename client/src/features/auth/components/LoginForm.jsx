import React from 'react';
import { useLoginController } from '@/features/auth/hooks/useLoginController';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import FormGroup from '@/components/molecules/FormGroup';
import Icon from '@/components/atoms/Icon';
import './LoginForm.css';

/**
 * LoginForm - Executor Component.
 * Implements the Login UI and connects it to the useLoginController.
 */
const LoginForm = () => {
    const {
        username,
        password,
        error, loading,
        handlers,
        t
    } = useLoginController();
    const { setUsername, setPassword, handleSubmit } = handlers;

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
                    <FormGroup label={t('username')}>
                        <Input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Usuario"
                            disabled={loading}
                            required
                        />
                    </FormGroup>

                    <FormGroup label={t('password')}>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />
                    </FormGroup>

                    <Button
                        type="submit"
                        variant="primary"
                        className="auth-card__button--submit"
                        disabled={loading}
                    >
                        {loading ? 'Accediendo...' : t('sign_in')}
                    </Button>
                </form>

                <footer className="auth-card__footer">
                    <div className="auth-card__download mb-6">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            icon={<Icon name="DOWNLOAD" size="1.1rem" />}
                            onClick={() => window.open('/uploads/secretary-app.apk', '_blank')}
                        >
                            {t('download_apk')}
                        </Button>
                    </div>
                    <p className="auth-card__footer-text">
                        © {new Date().getFullYear()} Consultorio Médico.
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default LoginForm;
