import React from 'react';
import ReportFilters from '@/features/reports/components/ui/ReportFilters';
import AppointmentReportTable from '@/features/reports/components/tables/AppointmentReportTable';
import PrescriptionReportTable from '@/features/reports/components/tables/PrescriptionReportTable';
import LicenseReportTable from '@/features/reports/components/tables/LicenseReportTable';
import CertificateReportTable from '@/features/reports/components/tables/CertificateReportTable';
import BalanceView from '@/features/reports/components/views/BalanceView';
import PageHeader from '@/components/organisms/PageHeader';

import './ReportsDashboard.css';

import FeatureToolbar from '@/components/organisms/FeatureToolbar';

const ReportsDashboard = ({
    t,
    activeTab,
    setActiveTab,
    month,
    year,
    setMonth,
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
        <section className="reports-dashboard">
            <PageHeader 
                title={t('reports_page_title')}
                subtitle={t('reports_page_subtitle')}
            />

            <FeatureToolbar
                className="reports-dashboard-orchestrator__top-actions"
                tabs={[
                    { id: 'appointments', label: t('appointments'), icon: 'event' },
                    { id: 'prescriptions', label: t('prescriptions'), icon: 'medication' },
                    { id: 'licenses', label: t('medical_licenses'), icon: 'description' },
                    { id: 'certificates', label: t('certificates'), icon: 'verified' },
                    { id: 'balance', label: t('balance'), icon: 'account_balance_wallet' }
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                actions={
                    <ReportFilters
                        month={month}
                        year={year}
                        onMonthChange={setMonth}
                        onYearChange={setYear}
                        onGenerate={handleGenerateReport}
                        onDownload={handleDownloadJson}
                        onPrint={onPrint}
                        onStepMonth={changeMonth}
                        onStepYear={(d) => setYear(prev => prev + d)}
                        isSubmitting={isSubmitting}
                        hasData={!!reportData}
                        t={t}
                    />
                }
            />

            <div className="dashboard-layout__grid animate-fade-in">
                <main className="dashboard-layout__main dashboard-layout__main--full">
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
        </section>
    );
};

export default ReportsDashboard;
