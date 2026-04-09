import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import ProfileEditor from './components/ProfileEditor';
import { useProfileController } from './hooks/useProfileController';

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
