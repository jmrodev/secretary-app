import React from 'react';
import UserManagement from '@/features/users/components/UserManagement';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './UserManager.module.css';

const UserManager = ({ t }) => {
    return (
        <div className={`${styles.root}`}>
            <header className={`${styles.header}`}>
                <h2 className={`${styles.title}`}>{t('user_management')}</h2>
                <p className={`${styles.subtitle}`}>{t('manage_users_subtitle')}</p>
            </header>

            <div className={`${styles.actions}`}>
                <Button
                    variant="primary"
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_USER_MODAL', { detail: 'CREATE' }))}
                    icon={<Icon name="add" size="1.1rem" />}
                >
                    {t('add_user')}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    icon={<Icon name="sync" size="1.1rem" />}
                >
                    {t('refresh')}
                </Button>
            </div>

            <div className={`${styles.content} dashboard-card dashboard-card--highlighted`}>
                <div className={`${styles.scrollable}`}>
                    <UserManagement excludeRoles={['patient']} />
                </div>
            </div>
        </div>
    );
};

export default UserManager;
