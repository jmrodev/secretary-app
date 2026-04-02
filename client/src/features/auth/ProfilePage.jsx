import React from 'react';
import MainLayout from '../../components/templates/MainLayout';
import { ProfileEditor } from './index';

/**
 * ProfilePage (Orchestrator).
 * User profile management interface.
 */
const ProfilePage = () => {
    return (
        <MainLayout wide>
            <div className="profile-page-orchestrator animate-fadeIn">
                <ProfileEditor />
            </div>
        </MainLayout>
    );
};

export default ProfilePage;
