import React from 'react';
import MainLayout from '../../components/templates/MainLayout';
import { ReportsDashboard, useReportsController } from './index';

/**
 * ReportsPage (Orchestrator).
 * Interface for monthly medical and financial reports.
 */
const ReportsPage = () => {
    const controller = useReportsController();

    return (
        <MainLayout wide>
            <div className="reports-page-orchestrator animate-fadeIn">
                <ReportsDashboard {...controller} />
            </div>
        </MainLayout>
    );
};

export default ReportsPage;
