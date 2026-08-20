import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

// Atomic Design Components
import { MainLayout } from '@/components/templates/MainLayout';
import { UserManagement, SecretaryPermissionsPanel } from '@/features/users/index';
import { useSecretaryPermissions } from '@/features/users/hooks/useSecretaryPermissions';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { TabNav } from '@/components/molecules/TabNav';
import { TabButton } from '@/components/atoms/TabButton';

// Doctor management tab
import { DoctorsManager } from '@/features/doctors';
import { useDoctorsPageController } from '@/features/doctors';
import { ScheduleBulkActions, ScheduleTimeBlock } from '@/features/appointments';
import { UserForm } from '@/features/users/index';
import { MessageTemplateEditor } from '@/features/config/components/forms/MessageTemplateEditor';

import styles from './AdminUsersPage.module.css';
import { resolveTab } from './utils/tabs';

/**
 * AdminUsersPage (Orchestrator).
 * Management interface for administrative and medical staff accounts,
 * split into two tabs: secretaries (accounts + grants) and doctors.
 * Guarded at route level: admin or secretary with can_manage_users.
 */
export const AdminUsersPage = () => {
    const { t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = resolveTab(searchParams.get('tab'));

    const permissions = useSecretaryPermissions();
    const doctorsController = useDoctorsPageController();

    const switchTab = (tab) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next, { replace: true });
    };

    const renderSecretariesTab = () => (
        <div className="dashboard-layout__grid">
            <aside className="dashboard-layout__sidebar">
                <div className="dashboard-card">
                    <h3 className="dashboard-card__title">
                        <Icon name="build" size="1.2rem" />
                        {t('actions')}
                    </h3>
                    <div className={`${styles.AdminUsersPage__actionsGroup}`}>
                        <Button
                            variant="primary"
                            className={`${styles.AdminUsersPage__btn}`}
                            onClick={() => window.dispatchEvent(new CustomEvent('OPEN_USER_MODAL', { detail: 'CREATE' }))}
                            icon={<Icon name="add" size="1.1rem" />}
                        >
                            {t('add_user')}
                        </Button>
                        <Button
                            variant="outline"
                            className={`${styles.AdminUsersPage__btn}`}
                            onClick={() => window.location.reload()}
                            icon={<Icon name="sync" size="1.1rem" />}
                        >
                            {t('refresh')}
                        </Button>
                    </div>
                </div>

                <SecretaryPermissionsPanel
                    t={t}
                    secretaries={permissions.secretaries}
                    loading={permissions.loading}
                    updating={permissions.updating}
                    selectedIds={permissions.selectedIds}
                    grantToAll={permissions.grantToAll}
                    onToggleSelect={permissions.toggleSelect}
                    onToggleGrantAll={() => permissions.setGrantToAll(prev => !prev)}
                    onGrant={permissions.applyGrant}
                    onRevoke={permissions.applyRevoke}
                />
            </aside>

            <section className="dashboard-layout__main">
                <section className={`${styles.AdminUsersPage__tableWrapper}`}>
                    <UserManagement
                        excludeRoles={['patient']}
                    />
                </section>
            </section>
        </div>
    );

    const renderDoctorsTab = () => (
        <DoctorsManager
            {...doctorsController}
            ScheduleBulkActionsComponent={ScheduleBulkActions}
            ScheduleTimeBlockComponent={ScheduleTimeBlock}
            UserFormComponent={UserForm}
            MessageTemplateEditorComponent={MessageTemplateEditor}
        />
    );

    return (
        <MainLayout wide flush title={t('user_management')}>
            <div>
                <div>
                    <div className="dashboard-nav-bar">
                        <TabNav>
                            <TabButton
                                isActive={activeTab === 'secretaries'}
                                onClick={() => switchTab('secretaries')}
                                activeColor="blue"
                            >
                                {t('tab_secretaries')}
                            </TabButton>
                            <TabButton
                                isActive={activeTab === 'doctor'}
                                onClick={() => switchTab('doctor')}
                                activeColor="blue"
                            >
                                {t('tab_doctors')}
                            </TabButton>
                        </TabNav>
                        <div className={`${styles.AdminUsersPage__navActions}`}>
                        </div>
                    </div>

                    {activeTab === 'doctor' ? renderDoctorsTab() : renderSecretariesTab()}
                </div>
            </div>
        </MainLayout>
    );
};