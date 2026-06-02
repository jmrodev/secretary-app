import React from 'react';
import { useLoginController } from '@/features/auth/hooks/useLoginController';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import FormGroup from '@/components/molecules/FormGroup';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import Card from '@/components/atoms/Card';
import './LoginForm.css';

/**
 * LoginForm - Executor Component.
 * Implements the Login UI and connects it to the useLoginController.
 */
import { getNow } from '../../../../utils/core/dateUtils';

const CURRENT_YEAR = getNow().getFullYear();

const LoginForm = () => {
    const {
        username,
        password,
        error, 
        loading,
        handlers,
        t
    } = useLoginController();

    return (
        <Card
            className="login-form animate-fade-in"
            header={
                <div className="auth-card__header">
                    <h1 className="auth-card__title">{t('welcome_back')}</h1>
                    <p className="auth-card__subtitle">{t('sign_in_subtitle')}</p>
                </div>
            }
            footer={
                <div className="auth-card__footer">
                    <div className="auth-card__download">
                        <Button
                            variant="outline"
                            size="sm"
                            className="auth-card__download-btn"
                            icon={<Icon name="DOWNLOAD" size="1.1rem" />}
                            onClick={() => window.open('/uploads/secretary-app.apk', '_blank')}
                        >
                            {t('download_apk')}
                        </Button>
                    </div>
                    <p className="auth-card__footer-text" suppressHydrationWarning>
                        © {CURRENT_YEAR} {t('app_name')}
                    </p>
                </div>
            }
        >
            {error && <div className="auth-card__error">{error}</div>}

            <form className="auth-card__form" onSubmit={handlers.handleSubmit}>
                <FormGroup label={t('username')}>
                    <Input
                        type="text"
                        value={username}
                        onChange={(e) => handlers.setUsername(e.target.value)}
                        placeholder={t('username_placeholder')}
                        disabled={loading}
                        required
                    />
                </FormGroup>

                <FormGroup label={t('password')}>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => handlers.setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        required
                    />
                </FormGroup>

                <Button
                    type="submit"
                    variant="primary"
                    className="auth-card__button--submit"
                >
                    {loading ? (
                        <Loading variant="inline" size="sm" text={t('signing_in')} />
                    ) : (
                        t('sign_in')
                    )}
                </Button>
            </form>
        </Card>
    );
};

export default LoginForm;
