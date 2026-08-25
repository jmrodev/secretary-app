import React from 'react';
import { MainLayout } from '@/components/templates/MainLayout';
import { ProfileEditor } from '@/features/auth/components/forms/ProfileEditor';
import { useProfileController } from '@/features/auth/hooks/useProfileController';
import styles from './ProfilePage.module.css';

/**
 * ProfilePage (Orchestrator).
 * User profile management interface.
 */
export const ProfilePage = () => {
    const profileProps = useProfileController();

    return (
        <MainLayout wide flush title={profileProps.t('profile')}>
            <section>
                <ProfileEditor {...profileProps} />
            </section>
        </MainLayout>
    );
};
