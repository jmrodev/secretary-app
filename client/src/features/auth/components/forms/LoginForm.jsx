import React from 'react';
import { useLoginController } from '@/features/auth/hooks/useLoginController';
import { Button } from '@/components/atoms/Button';
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

export const LoginForm = () => {
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
            className={`${styles.LoginForm__loginForm} animate-fade-in`}
            title={
                <div className={`${styles.LoginForm__header}`}>
                    <h1 className={`${styles.LoginForm__title}`}>{t('welcome_back')}</h1>
                    <p className={`${styles.LoginForm__subtitle}`}>{t('sign_in_subtitle')}</p>
                </div>
            }
            footer={
                <div className={`${styles.LoginForm__footer}`}>
                    <div className={`${styles.LoginForm__download}`}>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`${styles.LoginForm__downloadBtn}`}
                            icon={<Icon name="DOWNLOAD" size="1.1rem" />}
                            onClick={() => window.open('/uploads/secretary-app.apk', '_blank')}
                        >
                            {t('download_apk')}
                        </Button>
                    </div>
                    <p className={`${styles.LoginForm__footerText}`} suppressHydrationWarning>
                        © {CURRENT_YEAR} {t('app_name')}
                    </p>
                </div>
            }
        >
            {error && <div className={`${styles.LoginForm__error}`}>{error}</div>}

            <form className={`${styles.LoginForm__form}`} onSubmit={handlers.handleSubmit}>
                <FormGroup label={t('username')} className={styles.LoginForm__loginFormGroup}>
                    <Input
                        type="text"
                        value={username}
                        onChange={(e) => handlers.setUsername(e.target.value)}
                        placeholder={t('username_placeholder')}
                        disabled={loading}
                        className={styles.LoginForm__loginInput}
                        required
                    />
                </FormGroup>

                <FormGroup label={t('password')} className={styles.LoginForm__loginFormGroup}>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => handlers.setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        className={styles.LoginForm__loginInput}
                        required
                    />
                </FormGroup>

                <Button
                    type="submit"
                    variant="primary"
                    className={`${styles.LoginForm__buttonSubmit}`}
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
