import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import { useReportsController } from './hooks/useReportsController';
import ReportsDashboard from './components/ReportsDashboard';

/**
 * ReportsPage (Orchestrator).
 * Interface for monthly medical and financial reports.
 */
const ReportsPage = () => {
    const controller = useReportsController();

    return (
        <MainLayout wide>
            <main className="reports-page-orchestrator animate-fadeIn">
                <ReportsDashboard {...controller} />
            </main>
        </MainLayout>
    );
};

export default ReportsPage;
