import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Atomic Design Components
import Sidebar from '../components/organisms/Sidebar';
import UserManagement from '../components/organisms/UserManagement';
import Button from '../components/atoms/Button';

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
                <header className="page-header">
                    <div className="page-header__info">
                        <h1 className="page-header__title">{t('user_management') || 'Gestión de Usuarios'}</h1>
                        <p className="page-header__subtitle">{t('manage_users_subtitle') || 'Administra cuentas de médicos, secretarias y administradores.'}</p>
                    </div>
                    <div className="page-header__actions">
                        <Button onClick={() => window.dispatchEvent(new CustomEvent('OPEN_USER_MODAL', { detail: 'CREATE' }))}>
                            + {t('add_user') || 'Agregar Usuario'}
                        </Button>
                    </div>
                </header>

                <UserManagement
                    excludeRoles={['patient']}
                />
            </main>
        </div>
    );
};

export default AdminUsers;
