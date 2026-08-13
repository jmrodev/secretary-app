import React from 'react';
import UserManagement from '@/features/users/components/UserManagement';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './UserManager.module.css';

const UserManager = ({ t }) => {
    return (
        <div className={`${styles.root}`}>




            <div className={`${styles.content} dashboard-card dashboard-card--highlighted`}>
                <div className={`${styles.scrollable}`}>
                    <UserManagement excludeRoles={['patient']} />
                </div>
            </div>
        </div>
    );
};

export default UserManager;
