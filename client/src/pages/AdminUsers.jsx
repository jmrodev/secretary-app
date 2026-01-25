import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Atomic Design Components
import Sidebar from '../components/organisms/Sidebar';
import UserManagement from '../components/organisms/UserManagement';

const AdminUsers = () => {
    const { user: currentUser } = useAuth();
    const { t } = useLanguage();

    if (currentUser.role !== 'admin') {
        return <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <UserManagement
                    excludeRoles={['patient']}
                    title={t('user_management') || 'Gestión de Usuarios'}
                    subtitle={t('manage_users_subtitle') || 'Administra cuentas de médicos, secretarias y administradores.'}
                />
            </main>
        </div>
    );
};

export default AdminUsers;
