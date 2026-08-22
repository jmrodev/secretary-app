import React from 'react';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './PatientBlocker.module.css';

export const PatientBlocker = () => {
    const { logout } = useAuth();
    const { t } = useLanguage();

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    return (
        <div className={`${styles.PatientBlocker__root}`}>
            <div className={`${styles.PatientBlocker__card}`}>
                <div className={`${styles.PatientBlocker__iconContainer}`}>
                    <Icon name="check_circle" size="4rem" className={`${styles.PatientBlocker__iconSuccess}`} />
                </div>
                <h2 className={`${styles.PatientBlocker__title}`}>{t('registration_completed')}</h2>
                <p className={`${styles.PatientBlocker__message}`}>
                    {t('patient_blocker_message_p1')}
                    <br /><br />
                    {t('patient_blocker_message_p2')}
                </p>
                <Button
                    variant="secondary"
                    className={`${styles.PatientBlocker__button}`}
                    onClick={handleLogout}
                >
                    {t('logout')}
                </Button>
            </div>
        </div>
    );
};

