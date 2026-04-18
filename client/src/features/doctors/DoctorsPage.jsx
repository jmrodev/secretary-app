import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import DoctorsManager from '@/features/doctors/components/DoctorsManager';

import { useDoctorsPageController } from '@/features/doctors/hooks/useDoctorsPageController';

/**
 * DoctorsPage (Orchestrator).
 * Main interface for managing the medical staff and their schedules.
 */
const DoctorsPage = () => {
    const controller = useDoctorsPageController();

    return (
        <MainLayout wide>
            <div className="doctors-page-orchestrator animate-fadeIn">
                <DoctorsManager {...controller} />
            </div>
        </MainLayout>
    );
};

export default DoctorsPage;
