import React from 'react';
import { MainLayout } from '@/components/templates/MainLayout';
import { DoctorsManager } from '@/features/doctors/components/views/DoctorsManager';
import { useDoctorsPageController } from '@/features/doctors/hooks/useDoctorsPageController';
import { ScheduleBulkActions } from '@/features/appointments/components/schedule/ScheduleBulkActions';
import { ScheduleTimeBlock } from '@/features/appointments/components/schedule/ScheduleTimeBlock';
import { UserForm } from '@/features/users/components/UserForm';
import { MessageTemplateEditor } from '@/features/config/components/forms/MessageTemplateEditor';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * DoctorsPage (Orchestrator).
 * Main interface for managing the medical staff and their schedules.
 */
export const DoctorsPage = () => {
    const controller = useDoctorsPageController();
    const { t } = useLanguage();

    return (
        <MainLayout title={t('doctors_management')}>
            <div>
                <DoctorsManager
                    {...controller}
                    ScheduleBulkActionsComponent={ScheduleBulkActions}
                    ScheduleTimeBlockComponent={ScheduleTimeBlock}
                    UserFormComponent={UserForm}
                    MessageTemplateEditorComponent={MessageTemplateEditor}
                />
            </div>
        </MainLayout>
    );
};
