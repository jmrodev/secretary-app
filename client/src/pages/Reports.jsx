
import React from 'react';
import MainLayout from '../components/templates/MainLayout';
import ReportTabs from '../components/organisms/ReportTabs';
import ReportFilters from '../components/organisms/ReportFilters';
import AppointmentReportTable from '../components/organisms/AppointmentReportTable';
import PrescriptionReportTable from '../components/organisms/PrescriptionReportTable';
import LicenseReportTable from '../components/organisms/LicenseReportTable';
import CertificateReportTable from '../components/organisms/CertificateReportTable';
import BalanceView from '../components/organisms/BalanceView';

import { useReportsController } from '../controllers/useReportsController';
import { printReport } from '../utils/reportPrintHelper';

import './Reports.css';

const Reports = () => {
    const {
        t,
        activeTab,
        setActiveTab,
        month,
        setMonth,
        year,
        setYear,
        selectedDoctorId,
        setSelectedDoctorId,
        reportData,
        isSubmitting,
        doctors,
        handleGenerateReport,
        handleDownloadJson,
        changeMonth
    } = useReportsController();

    const handlePrint = () => {
        printReport(reportData, { activeTab, month, year, t });
    };

    return (
        <MainLayout>
            <header className="page-header">
                <div className="page-header__info">
                    <h1 className="page-header__title">
                        {t('reports_page_title') || 'Reportes y Exportaciones'}
                    </h1>
                    <p className="page-header__subtitle">
                        {t('reports_page_subtitle') || 'Generación de reportes mensuales de turnos y recetas.'}
                    </p>
                </div>
            </header>

            <ReportTabs
                activeTab={activeTab}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                    // Reset data when switching tabs for clarity
                }}
                t={t}
            />

            <ReportFilters
                month={month}
                year={year}
                selectedDoctorId={selectedDoctorId}
                onMonthChange={setMonth}
                onYearChange={setYear}
                onDoctorChange={setSelectedDoctorId}
                onGenerate={handleGenerateReport}
                onDownload={handleDownloadJson}
                onPrint={handlePrint}
                onStepMonth={changeMonth}
                onStepYear={(d) => setYear(year + d)}
                isSubmitting={isSubmitting}
                hasData={!!reportData}
                doctors={doctors}
                t={t}
            />

            <div className="reports-page__results">
                {activeTab === 'appointments' && (
                    <AppointmentReportTable data={reportData} t={t} />
                )}
                {activeTab === 'prescriptions' && (
                    <PrescriptionReportTable data={reportData} t={t} />
                )}
                {activeTab === 'licenses' && (
                    <LicenseReportTable data={reportData} t={t} />
                )}
                {activeTab === 'certificates' && (
                    <CertificateReportTable data={reportData} t={t} />
                )}
                {activeTab === 'balance' && (
                    <BalanceView reportData={reportData} month={month} year={year} t={t} />
                )}
            </div>
        </MainLayout>
    );
};

export default Reports;
