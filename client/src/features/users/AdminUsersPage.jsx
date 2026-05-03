import React from 'react';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/context/LanguageContext';

// Atomic Design Components
import MainLayout from '@/components/templates/MainLayout';
import { UserManagement } from '@/features/users/index';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './AdminUsersPage.css';

/**
 * AdminUsersPage (Orchestrator).
 * Management interface for administrative and medical staff accounts.
 */
const AdminUsersPage = () => {
    const { user: currentUser } = useAuth();
    const { t } = useLanguage();

    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <MainLayout>
                <div className="admin-users-page__access-denied">
                    <Icon name="block" size="3rem" className="admin-users-page__denied-icon" />
                    <h2 className="admin-users-page__denied-title">Access Denied</h2>
                    <p className="admin-users-page__denied-text">No tiene permisos para gestionar usuarios.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout wide flush title={t('user_management') || 'Gestión de Usuarios'}>
            <div className="admin-users-page-orchestrator">
                <div className="layout-content-area animate-fadeIn">
                    <div className="dashboard-nav-bar">
                        <div className="admin-users-page__spacer"></div>
                        <div className="admin-users-page__nav-actions">
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        <aside className="dashboard-sidebar">
                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="build" size="1.2rem" />
                                    {t('actions') || 'Acciones'}
                                </h3>
                                <div className="admin-users-page__actions-group">
                                    <Button
                                        variant="primary"
                                        className="admin-users-page__btn"
                                        onClick={() => window.dispatchEvent(new CustomEvent('OPEN_USER_MODAL', { detail: 'CREATE' }))}
                                        icon={<Icon name="add" size="1.1rem" />}
                                    >
                                        {t('add_user') || 'Agregar Usuario'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="admin-users-page__btn"
                                        onClick={() => window.location.reload()}
                                        icon={<Icon name="sync" size="1.1rem" />}
                                    >
                                        {t('refresh') || 'Actualizar'}
                                    </Button>
                                </div>
                            </div>
                        </aside>

                        <main className="dashboard-main">
                            <section className="admin-users-page__table-wrapper">
                                <UserManagement
                                    excludeRoles={['patient']}
                                />
                            </section>
                        </main>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminUsersPage;
