import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import { useReportsController } from '@/features/reports/hooks/useReportsController';
import { ReportsDashboard } from '@/features/reports/components/views/ReportsDashboard';
import styles from './ReportsPage.module.css';

/**
 * ReportsPage (Orchestrator).
 * Interface for monthly medical and financial reports.
 */
export const ReportsPage = () => {
    const controller = useReportsController();

    return (
        <MainLayout wide flush title={controller.t('reports')}>
            <section>
                <ReportsDashboard {...controller} />
            </section>
        </MainLayout>
    );
};



