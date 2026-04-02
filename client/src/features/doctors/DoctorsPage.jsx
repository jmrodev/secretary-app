import React from 'react';
import MainLayout from '../../components/templates/MainLayout';
import { DoctorsManager } from './index';

/**
 * DoctorsPage (Orchestrator).
 * Main interface for managing the medical staff and their schedules.
 */
const DoctorsPage = () => {
    return (
        <MainLayout wide>
            <div className="doctors-page-orchestrator animate-fadeIn">
                <DoctorsManager />
            </div>
        </MainLayout>
    );
};

export default DoctorsPage;
