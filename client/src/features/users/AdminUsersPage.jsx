import React from 'react';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/hooks/useLanguage';

// Atomic Design Components
import MainLayout from '@/components/templates/MainLayout';
import { UserManagement } from '@/features/users/index';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './AdminUsersPage.module.css';

/**
 * AdminUsersPage (Orchestrator).
 * Management interface for administrative and medical staff accounts.
 */
const AdminUsersPage = () => {
    const { user: currentUser } = useAuth();
    const { t } = useLanguage();

    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <MainLayout> {/* layout:exception — access denied state, no full page chrome needed */}
                <div className={`${styles.accessDenied}`}>
                    <Icon name="block" size="3rem" className={`${styles.deniedIcon}`} />
                    <h2 className={`${styles.deniedTitle}`}>Access Denied</h2>
                    <p className={`${styles.deniedText}`}>No tiene permisos para gestionar usuarios.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout wide flush title={t('user_management') || 'Gestión de Usuarios'}>
            <div>
                <div>
                    <div className="dashboard-nav-bar">
                        <div className={`${styles.spacer}`}></div>
                        <div className={`${styles.navActions}`}>
                        </div>
                    </div>

                    <div className="dashboard-layout__grid">
                        <aside className="dashboard-layout__sidebar">
                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="build" size="1.2rem" />
                                    {t('actions') || 'Acciones'}
                                </h3>
                                <div className={`${styles.actionsGroup}`}>
                                    <Button
                                        variant="primary"
                                        className={`${styles.btn}`}
                                        onClick={() => window.dispatchEvent(new CustomEvent('OPEN_USER_MODAL', { detail: 'CREATE' }))}
                                        icon={<Icon name="add" size="1.1rem" />}
                                    >
                                        {t('add_user') || 'Agregar Usuario'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={`${styles.btn}`}
                                        onClick={() => window.location.reload()}
                                        icon={<Icon name="sync" size="1.1rem" />}
                                    >
                                        {t('refresh') || 'Actualizar'}
                                    </Button>
                                </div>
                            </div>
                        </aside>

                        <section className="dashboard-layout__main">
                            <section className={`${styles.tableWrapper}`}>
                                <UserManagement
                                    excludeRoles={['patient']}
                                />
                            </section>
                        </section>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminUsersPage;
