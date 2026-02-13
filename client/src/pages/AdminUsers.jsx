
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Atomic Design Components
import MainLayout from '../components/templates/MainLayout';
import UserManagement from '../components/organisms/UserManagement';
import Button from '../components/atoms/Button';
import Icon from '../components/atoms/Icon';

const AdminUsers = () => {
    const { user: currentUser } = useAuth();
    const { t } = useLanguage();

    if (currentUser.role !== 'admin') {
        return (
            <MainLayout wide>
                <div className="max-w-md mx-auto mt-20 p-8 bg-red-50 border border-red-100 rounded-xl text-center">
                    <Icon name="DELETE" size="3rem" className="text-red-500 mb-4 mx-auto" />
                    <h2 className="text-red-800 font-bold text-xl mb-2">Access Denied</h2>
                    <p className="text-red-600">No tiene permisos para gestionar usuarios.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout wide>
            <div className="admin-users-page">
                <header className="dashboard-header animate-fadeIn">
                    <h1 className="dashboard-header__title">{t('user_management') || 'Gestión de Usuarios'}</h1>
                    <p className="dashboard-header__subtitle">{t('manage_users_subtitle') || 'Administra cuentas de médicos, secretarias y administradores.'}</p>
                </header>

                <div className="dashboard-nav-bar animate-fadeIn">
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-4">
                        {/* Placeholder for any top-level actions or stats */}
                    </div>
                </div>

                <div className="dashboard-grid animate-fadeIn">
                    <aside className="dashboard-sidebar">
                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">🛠️ {t('actions') || 'Acciones'}</h3>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="primary"
                                    className="justify-start w-full"
                                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_USER_MODAL', { detail: 'CREATE' }))}
                                    icon={<Icon name="ADD" size="1.2rem" />}
                                >
                                    {t('add_user') || 'Agregar Usuario'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="justify-start w-full"
                                    onClick={() => window.location.reload()}
                                    icon={<Icon name="SYNC" size="1.2rem" />}
                                >
                                    {t('refresh') || 'Actualizar'}
                                </Button>
                            </div>
                        </div>
                    </aside>

                    <main className="dashboard-main">
                        <div className="dashboard-card no-padding">
                            <UserManagement
                                excludeRoles={['patient']}
                            />
                        </div>
                    </main>
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminUsers;
