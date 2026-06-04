import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import ProfileEditor from '@/features/auth/components/forms/ProfileEditor';
import { useProfileController } from '@/features/auth/hooks/useProfileController';

/**
 * ProfilePage (Orchestrator).
 * User profile management interface.
 */
const ProfilePage = () => {
    const profileProps = useProfileController();

    return (
        <MainLayout wide flush title={profileProps.t('profile')}>
            <main className={`${styles.profilePage} layout-content-area animate-fade-in`}>
                <ProfileEditor {...profileProps} />
            </main>
        </MainLayout>
    );
};

export default ProfilePage;
