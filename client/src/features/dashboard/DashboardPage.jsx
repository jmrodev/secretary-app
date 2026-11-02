import React from 'react';
import { useDashboardController } from './hooks/useDashboardController';
import { DashboardReminders } from '@/features/dashboard/components/DashboardReminders';
import { MedicalRequirementManager } from '@/features/medical_documents/components/ui/MedicalRequirementManager';
import { DashboardModalOrchestrator } from './components/DashboardModalOrchestrator';
import { MainLayout } from '@/components/templates/MainLayout';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Loading } from '@/components/atoms/Loading';
import { CashMonitorCard } from './components/CashMonitorCard';

import styles from './DashboardPage.module.css';

/**
 * DashboardPage (ECC-Pattern Orchestrator).
 * Central hub of the application with optimized metrics and real-time monitoring.
 * Decoupled from specific domain modals via DashboardModalOrchestrator.
 */
export const DashboardPage = () => {
    const controller = useDashboardController();
    const {
        user, t, loading, error, reminders,
        handlers, isAdmin, isSecretary, isDoctor
    } = controller;

    const isAdminOrSecretary = isAdmin || isSecretary;
    const { 
        refreshDashboard, handleOpenNewRequest, setPaymentModal, navigate,
        handleWhatsAppReminder, handleCompleteReminder, handleMarkNotified 
    } = handlers;

    if (!user) return <Loading variant="full-page" />;

    const shouldShowLoadingState = loading && !controller.fetched;
    const shouldShowErrorState = Boolean(error) && !controller.fetched;

    return (
        <MainLayout title={t('dashboard')}>
            <div className={styles.DashboardPage__container}>
                {shouldShowErrorState ? (
                    <div className={styles.DashboardPage__errorBanner}>
                        <div className={styles.DashboardPage__errorContent}>
                            <Icon name="error" className={styles.DashboardPage__errorIcon} />
                            <div>
                                <h3 className={styles.DashboardPage__errorTitle}>{t('error')}</h3>
                                <p className={styles.DashboardPage__errorText}>{t('dashboard_error_message')}</p>
                            </div>
                        </div>
                        <Button variant="premium" size="sm" onClick={refreshDashboard} icon={<Icon name="refresh" />}>{t('retry')}</Button>
                    </div>
                ) : (
                    <>
                        {/* 1. OPERATIONAL SUMMARY STRIP (Restrained, Unified, Non-cloned) */}
                        <header className={styles.DashboardPage__summaryStrip}>
                            {/* Live Cash Monitor */}
                            <div className={styles.DashboardPage__stripSection}>
                                <CashMonitorCard 
                                    stats={controller.stats?.financeStats || controller.financeStats} 
                                    t={t} 
                                    className={styles.DashboardPage__cashMonitorStrip} 
                                />
                            </div>

                            <div className={styles.DashboardPage__stripDivider} />

                            {/* Appointments Progression */}
                            <div className={styles.DashboardPage__stripSection}>
                                <div className={styles.DashboardPage__stripHeader}>
                                    <span className={styles.DashboardPage__stripTitle}>{t('appointments')}</span>
                                    <span className={styles.DashboardPage__stripSubtitle}>{t('this_day')}</span>
                                </div>
                                <div className={styles.DashboardPage__metricRow}>
                                    <div className={styles.DashboardPage__metricItem}>
                                        <span className={styles.DashboardPage__metricValue}>
                                            {controller.stats?.appointments?.today?.count || 0}
                                        </span>
                                        <span className={styles.DashboardPage__metricCaption}>{t('today')}</span>
                                    </div>
                                    <div className={styles.DashboardPage__metricItem}>
                                        <span className={styles.DashboardPage__metricValueSecondary}>
                                            {controller.stats?.appointments?.week?.count || 0}
                                        </span>
                                        <span className={styles.DashboardPage__metricCaption}>{t('view_week')}</span>
                                    </div>
                                    <div className={styles.DashboardPage__metricItem}>
                                        <span className={styles.DashboardPage__metricValueSecondary}>
                                            {controller.stats?.appointments?.month?.count || 0}
                                        </span>
                                        <span className={styles.DashboardPage__metricCaption}>{t('date_range')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.DashboardPage__stripDivider} />

                            {/* Active Patient Census */}
                            <div className={styles.DashboardPage__stripSection}>
                                <div className={styles.DashboardPage__stripHeader}>
                                    <span className={styles.DashboardPage__stripTitle}>{t('patients')}</span>
                                    <span className={styles.DashboardPage__stripSubtitle}>{t('total_active_patients')}</span>
                                </div>
                                <div className={styles.DashboardPage__metricRow}>
                                    <div className={styles.DashboardPage__metricItem}>
                                        <span className={styles.DashboardPage__metricValue}>
                                            {controller.stats?.total_patients || 0}
                                        </span>
                                        <span className={styles.DashboardPage__metricCaption}>{t('active')}</span>
                                    </div>
                                    {isAdminOrSecretary && (
                                        <>
                                            <div className={styles.DashboardPage__metricItem}>
                                                <span className={styles.DashboardPage__metricValuePill}>
                                                    +{controller.newPatientStats?.currentDay || 0}
                                                </span>
                                                <span className={styles.DashboardPage__metricCaption}>{t('new_patients_today')}</span>
                                            </div>
                                            <div className={styles.DashboardPage__metricItem}>
                                                <span className={styles.DashboardPage__metricValueSecondary}>
                                                    +{controller.newPatientStats?.currentYear || 0}
                                                </span>
                                                <span className={styles.DashboardPage__metricCaption}>{t('new_patients_year')}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Quick Navigation / Audit Shortcut */}
                            {isAdminOrSecretary && (
                                <>
                                    <div className={styles.DashboardPage__stripDivider} />
                                    <div className={styles.DashboardPage__reportsStrip}>
                                        <div className={styles.DashboardPage__reportsInfo}>
                                            <span className={styles.DashboardPage__stripTitle}>{t('reports')}</span>
                                            <p className={styles.DashboardPage__reportsText}>{t('reports_dashboard_hint')}</p>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => navigate('/reports')}
                                            icon={<Icon name="chevron_right" size="1.1rem" />}
                                        >
                                            {t('reports')}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </header>

                        {/* 2. MAIN WORKING SURFACES (High-Density Operational Split) */}
                        <div className={styles.DashboardPage__workspaceGrid}>
                            {/* Primary Workstation: Active Clinical Requests */}
                            <section className={styles.DashboardPage__workspacePrimary}>
                                <div className={styles.DashboardPage__surfaceHeader}>
                                    <div>
                                        <h2 className={styles.DashboardPage__surfaceTitle}>{t('medical_requests_management')}</h2>
                                        <p className={styles.DashboardPage__surfaceSubtitle}>{t('medical_requests_desc')}</p>
                                    </div>
                                </div>
                                <div className={styles.DashboardPage__surfaceBody}>
                                    {shouldShowLoadingState ? <Loading variant="centered" /> : (
                                        <MedicalRequirementManager user={user} variant="compact" setPaymentModal={setPaymentModal} />
                                    )}
                                </div>
                            </section>

                            {/* Secondary Workstation: Clinical Reminders & Notifications */}
                            <aside className={styles.DashboardPage__workspaceSecondary}>
                                <div className={styles.DashboardPage__surfaceHeader}>
                                    <div>
                                        <h2 className={styles.DashboardPage__surfaceTitle}>{t('dashboard_reminders')}</h2>
                                        <p className={styles.DashboardPage__surfaceSubtitle}>{t('followups_notifications')}</p>
                                    </div>
                                </div>
                                <div className={styles.DashboardPage__surfaceBody}>
                                    {shouldShowLoadingState ? <Loading variant="centered" /> : (
                                        <DashboardReminders
                                            reminders={reminders}
                                            t={t}
                                            onWhatsApp={handleWhatsAppReminder}
                                            onComplete={handleCompleteReminder}
                                            onMarkNotified={handleMarkNotified}
                                            onViewProfile={(id) => navigate('/patients', { state: { selectedPatientId: id } })}
                                        />
                                    )}
                                </div>
                            </aside>
                        </div>
                    </>
                )}
            </div>

            <DashboardModalOrchestrator controller={controller} />
        </MainLayout>
    );
};
