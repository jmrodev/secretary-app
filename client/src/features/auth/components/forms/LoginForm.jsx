import React from 'react';
import { useLoginController } from '@/features/auth/hooks/useLoginController';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import FormGroup from '@/components/molecules/FormGroup';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import Card from '@/components/atoms/Card';
import styles from './LoginForm.module.css';

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
                <div className={`${styles.header}`}>
                    <h1 className={`${styles.title}`}>{t('welcome_back')}</h1>
                    <p className={`${styles.subtitle}`}>{t('sign_in_subtitle')}</p>
                </div>
            }
            footer={
                <div className={`${styles.footer}`}>
                    <div className={`${styles.download}`}>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`${styles.downloadBtn}`}
                            icon={<Icon name="DOWNLOAD" size="1.1rem" />}
                            onClick={() => window.open('/uploads/secretary-app.apk', '_blank')}
                        >
                            {t('download_apk')}
                        </Button>
                    </div>
                    <p className={`${styles.footerText}`} suppressHydrationWarning>
                        © {CURRENT_YEAR} {t('app_name')}
                    </p>
                </div>
            }
        >
            {error && <div className={`${styles.error}`}>{error}</div>}

            <form className={`${styles.form}`} onSubmit={handlers.handleSubmit}>
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
                    className={`${styles.buttonSubmit}`}
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
