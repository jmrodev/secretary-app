import { useProfileController, ProfileEditor } from '../features/auth';
import MainLayout from '../components/templates/MainLayout';
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
