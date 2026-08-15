import React from 'react';
import { UserManagement } from '@/features/users/components/UserManagement';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './UserManager.module.css';

export const UserManager = ({ t }) => {
    return (
        <div className={`${styles.UserManager__root}`}>




            <div className={`${styles.UserManager__content} dashboard-card dashboard-card--highlighted`}>
                <div className={`${styles.UserManager__scrollable}`}>
                    <UserManagement excludeRoles={['patient']} />
                </div>
            </div>
        </div>
    );
};
