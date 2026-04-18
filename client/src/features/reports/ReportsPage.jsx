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
        <MainLayout wide>
            <div className="reports-page-orchestrator animate-fadeIn">
                <ReportsDashboard {...controller} />
            </div>
        </MainLayout>
    );
};

export default ReportsPage;
