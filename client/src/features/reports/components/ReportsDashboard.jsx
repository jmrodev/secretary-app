import React from 'react';
import ReportTabs from './ReportTabs';
import ReportFilters from './ReportFilters';
import AppointmentReportTable from './AppointmentReportTable';
import PrescriptionReportTable from './PrescriptionReportTable';
import LicenseReportTable from './LicenseReportTable';
import CertificateReportTable from './CertificateReportTable';
import BalanceView from './BalanceView';
import { PageHeader } from '@/features/layout';
import Icon from '@/components/atoms/Icon';
import './ReportsView.css';

const ReportsDashboard = ({
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
    changeMonth,
    onPrint
}) => {
    return (
        <div className="reports-dashboard">
            <PageHeader 
                title={t('reports_page_title') || 'Reportes y Exportaciones'}
                subtitle={t('reports_page_subtitle') || 'Generación de reportes mensuales de turnos y recetas.'}
            />

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
                        <h3 className="dashboard-card__title">
                            <Icon name="filter_list" size="1.2rem" />
                            {t('filters') || 'Filtros'}
                        </h3>
                        <ReportFilters
                            month={month}
                            year={year}
                            selectedDoctorId={selectedDoctorId}
                            onMonthChange={setMonth}
                            onYearChange={setYear}
                            onDoctorChange={setSelectedDoctorId}
                            onGenerate={handleGenerateReport}
                            onDownload={handleDownloadJson}
                            onPrint={onPrint}
                            onStepMonth={changeMonth}
                            onStepYear={(d) => setYear(year + d)}
                            isSubmitting={isSubmitting}
                            hasData={!!reportData}
                            doctors={doctors}
                            t={t}
                            vertical
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
    );
};

export default ReportsDashboard;
