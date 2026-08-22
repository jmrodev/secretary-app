import React from 'react';
import { MainLayout } from '@/components/templates/MainLayout';
import { DoctorsManager } from '@/features/doctors/components/views/DoctorsManager';
import { useDoctorsPageController } from '@/features/doctors/hooks/useDoctorsPageController';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * DoctorsPage (Orchestrator).
 * Main interface for managing the medical staff and their schedules.
 */
export const DoctorsPage = () => {
    const controller = useDoctorsPageController();
    const { t } = useLanguage();

    return (
        <MainLayout wide flush title={t('doctors_management') || "Gestión de Profesionales"}>
            <div>
                <DoctorsManager {...controller} />
            </div>
        </MainLayout>
    );
};
