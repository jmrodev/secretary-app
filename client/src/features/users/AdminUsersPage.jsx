import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

// Atomic Design Components
import { MainLayout } from '@/components/templates/MainLayout';
import { UserManagement } from '@/features/users/index';
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
 * split into two tabs: secretaries and doctors.
 * Guarded at route level: admin or secretary with can_manage_users.
 */
export const AdminUsersPage = ({ isEmbedded = false }) => {
    const { t } = useLanguage();
    const { isAdmin } = usePermissions();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = resolveTab(searchParams.get('userTab'));
    const doctorsController = useDoctorsPageController();

    // Secretaries cannot manage admin accounts
    const excludeRoles = isAdmin ? ['patient'] : ['patient', 'admin'];

    const switchTab = (tab) => {
        const next = new URLSearchParams(searchParams);
        next.set('userTab', tab);
        setSearchParams(next, { replace: true });
    };

    const renderSecretariesTab = () => (
        <section className={`${styles.AdminUsersPage__tableWrapper}`}>
            <UserManagement
                excludeRoles={excludeRoles}
            />
        </section>
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

    const content = (
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
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <MainLayout wide flush title={t('user_management')}>
            {content}
        </MainLayout>
    );
};