import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import DoctorsManager from '@/features/doctors/components/DoctorsManager';

import { useDoctorsPageController } from '@/features/doctors/hooks/useDoctorsPageController';
import { PageHeader } from '@/features/layout';
import heroBg from '@/features/dashboard/assets/dashboard_hero.png';

/**
 * DoctorsPage (Orchestrator).
 * Main interface for managing the medical staff and their schedules.
 */
const DoctorsPage = () => {
    const controller = useDoctorsPageController();

    return (
        <MainLayout wide>
            <PageHeader 
                variant="premium"
                backgroundUrl={heroBg}
                title="Gestión de Profesionales"
                subtitle="Configura el staff médico, horarios y especialidades."
                hideDoctorSelector={true}
            />
            <div className="layout-content-area animate-fadeIn">
                <DoctorsManager {...controller} />
            </div>
        </MainLayout>
    );
};

export default DoctorsPage;
