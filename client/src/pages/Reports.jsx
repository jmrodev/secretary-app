
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
        <MainLayout wide>
            <div className="reports-page">
                <header className="dashboard-header animate-fadeIn">
                    <h1 className="dashboard-header__title">
                        {t('reports_page_title') || 'Reportes y Exportaciones'}
                    </h1>
                    <p className="dashboard-header__subtitle">
                        {t('reports_page_subtitle') || 'Generación de reportes mensuales de turnos y recetas.'}
                    </p>
                </header>

                <div className="dashboard-nav-bar dashboard-nav-bar--centered animate-fadeIn">
                    <ReportTabs
                        activeTab={activeTab}
                        onTabChange={(tab) => {
                            setActiveTab(tab);
                        }}
                        t={t}
                    />
                </div>

                <div className="dashboard-grid animate-fadeIn">
                    <aside className="dashboard-sidebar">
                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">⚙️ {t('filters') || 'Filtros'}</h3>
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
                                vertical // Added hint for vertical layout in sidebar if supported
                            />
                        </div>
                    </aside>

                    <main className="dashboard-main">
                        <div className="dashboard-card no-padding">
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
                        </div>
                    </main>
                </div>
            </div>
        </MainLayout>
    );
};

export default Reports;
