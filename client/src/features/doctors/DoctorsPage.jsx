import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import DoctorsManager from './components/DoctorsManager';
import { useDoctorsPageController } from './hooks/useDoctorsPageController';
import './DoctorsPage.css';

/**
 * DoctorsPage (Orchestrator).
 * Main interface for managing the medical staff and their schedules.
 */
const DoctorsPage = () => {
    const controller = useDoctorsPageController();

    return (
        <MainLayout wide>
            <main className="doctors-page-orchestrator animate-fadeIn">
                <DoctorsManager {...controller} />
            </main>
        </MainLayout>
    );
};

export default DoctorsPage;
