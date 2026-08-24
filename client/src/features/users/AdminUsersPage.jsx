import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

// Atomic Design Components
import { UserManagement } from '@/features/users/index';
import { TabNav } from '@/components/molecules/TabNav';
import { TabButton } from '@/components/atoms/TabButton';

// Doctor management tab
import { DoctorsManager } from '@/features/doctors/components/views/DoctorsManager';
import { useDoctorsPageController } from '@/features/doctors/hooks/useDoctorsPageController';
import { ScheduleBulkActions } from '@/features/appointments/components/schedule/ScheduleBulkActions';
import { ScheduleTimeBlock } from '@/features/appointments/components/schedule/ScheduleTimeBlock';
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
export const AdminUsersPage = () => {
    const { t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = resolveTab(searchParams.get('subtab'));
    const doctorsController = useDoctorsPageController();

    const switchTab = (tab) => {
        const next = new URLSearchParams(searchParams);
        next.set('subtab', tab);
        setSearchParams(next, { replace: true });
    };

    const renderSecretariesTab = () => (
        <section className={`${styles.AdminUsersPage__tableWrapper}`}>
            <UserManagement
                excludeRoles={['patient']}
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

    return (
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
};