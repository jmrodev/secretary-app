import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import { useReportsController } from '@/features/reports/hooks/useReportsController';
import ReportsDashboard from '@/features/reports/components/ReportsDashboard';

/**
 * ReportsPage (Orchestrator).
 * Interface for monthly medical and financial reports.
 */
const ReportsPage = () => {
    const controller = useReportsController();

    return (
        <MainLayout wide title={controller.t('reports')}>
            <main className="reports-page-orchestrator animate-fade-in">
                <ReportsDashboard {...controller} />
            </main>
        </MainLayout>
    );
};

export default ReportsPage;
