import React from 'react';
import { ReportFilters } from '@/features/reports/components/ui/ReportFilters';
import { AppointmentReportTable } from '@/features/reports/components/tables/AppointmentReportTable';
import { PrescriptionReportTable } from '@/features/reports/components/tables/PrescriptionReportTable';
import { LicenseReportTable } from '@/features/reports/components/tables/LicenseReportTable';
import { CertificateReportTable } from '@/features/reports/components/tables/CertificateReportTable';
import { BalanceView } from '@/features/reports/components/views/BalanceView';
import PageHeader from '@/components/ui/PageHeader';
import FeatureToolbar from '@/components/organisms/FeatureToolbar';
import styles from './ReportsDashboard.module.css';

export const ReportsDashboard = ({
    t,
    activeTab,
    setActiveTab,
    month,
    year,
    setMonth,
    setYear,
    selectedDoctorId: _selectedDoctorId,
    setSelectedDoctorId: _setSelectedDoctorId,
    reportData,
    error,
    isSubmitting,
    doctors: _doctors,
    handleGenerateReport,
    handleDownloadJson,
    changeMonth,
    onPrint
}) => {
    return (
        <section className={styles.reportsDashboard}>
            <PageHeader 
                title={t('reports_page_title')}
                subtitle={t('reports_page_subtitle')}
            />

            <FeatureToolbar
                className={styles.reportsDashboard__topActions}
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

            <div className={`${styles.reportsDashboard__grid} animate-fade-in`}>
                <main className={styles.reportsDashboard__main}>
                    <div className={styles.reportsDashboard__card}>
                        <div className={styles.results}>
                            {error && (
                                <div className={styles.errorState}>
                                    {error}
                                </div>
                            )}
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



