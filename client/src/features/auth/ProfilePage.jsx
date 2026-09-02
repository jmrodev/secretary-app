import React from 'react';
import { MainLayout } from '@/components/templates/MainLayout';
import { ProfileEditor } from '@/features/auth/components/forms/ProfileEditor';
import { useProfileController } from '@/features/auth/hooks/useProfileController';

/**
 * ProfilePage (Orchestrator).
 * User profile management interface.
 */
export const ProfilePage = () => {
    const profileProps = useProfileController();

    return (
        <MainLayout preset="contained" title={profileProps.t('profile')}>
            <section>
                <ProfileEditor {...profileProps} />
            </section>
        </MainLayout>
    );
};
