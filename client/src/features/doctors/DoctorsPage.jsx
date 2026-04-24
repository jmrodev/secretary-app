import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import DoctorsManager from '@/features/doctors/components/DoctorsManager';
import { useDoctorsPageController } from '@/features/doctors/hooks/useDoctorsPageController';
import { PageHeader } from '@/features/layout';

/**
 * DoctorsPage (Orchestrator).
 * Main interface for managing the medical staff and their schedules.
 */
const DoctorsPage = () => {
    const controller = useDoctorsPageController();

    return (
        <MainLayout wide flush>
            <PageHeader 
                variant="premium"
                title="Gestión de Profesionales"
            />
            <div className="layout-content-area animate-fadeIn">
                <DoctorsManager {...controller} />
            </div>
        </MainLayout>
    );
};

export default DoctorsPage;
