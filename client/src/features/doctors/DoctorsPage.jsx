import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import { DoctorsManager } from '@/features/doctors/components/views/DoctorsManager';
import { useDoctorsPageController } from '@/features/doctors/hooks/useDoctorsPageController';

/**
 * DoctorsPage (Orchestrator).
 * Main interface for managing the medical staff and their schedules.
 */
export const DoctorsPage = () => {
    const controller = useDoctorsPageController();

    return (
        <MainLayout wide flush title="Gestión de Profesionales">
            <div>
                <DoctorsManager {...controller} />
            </div>
        </MainLayout>
    );
};
