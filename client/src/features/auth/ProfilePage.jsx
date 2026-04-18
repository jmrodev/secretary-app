import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import ProfileEditor from '@/features/auth/components/ProfileEditor';
import { useProfileController } from '@/features/auth/hooks/useProfileController';

/**
 * ProfilePage (Orchestrator).
 * User profile management interface.
 */
const ProfilePage = () => {
    const profileProps = useProfileController();

    return (
        <MainLayout wide>
            <div className="profile-page animate-fadeIn">
                <ProfileEditor {...profileProps} />
            </div>
        </MainLayout>
    );
};

export default ProfilePage;
