import React from 'react';
import { useProfileController } from '../controllers/useProfileController';
import MainLayout from '../components/templates/MainLayout';
import ProfileEditor from '../components/organisms/ProfileEditor';
import './Profile.css';

const Profile = () => {
    const controller = useProfileController();

    return (
        <MainLayout>
            <ProfileEditor {...controller} />
        </MainLayout>
    );
};

export default Profile;
