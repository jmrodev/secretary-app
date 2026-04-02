import React from 'react';
import MainLayout from '../components/templates/MainLayout';
import { ReportsDashboard, useReportsController } from '../features/reports';
import { printReport } from '../utils/reportPrintHelper';
import './Reports.css';

const Reports = () => {
    const controller = useReportsController();
    const { t, activeTab, month, year, reportData } = controller;
    const { alert } = controller; // Assumed available in controller, otherwise import useModal

    const handlePrint = () => {
        printReport(reportData, { activeTab, month, year, t, alert });
    };

    return (
        <MainLayout wide>
            <ReportsDashboard
                {...controller}
                onPrint={handlePrint}
            />
        </MainLayout>
    );
};

export default Reports;
