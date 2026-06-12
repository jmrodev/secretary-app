import React from 'react';
import { useDashboardController } from './hooks/useDashboardController';
import DashboardReminders from '@/features/dashboard/components/DashboardReminders';
import MedicalRequirementManager from '@/features/medical_documents/components/ui/MedicalRequirementManager';
import DashboardModalOrchestrator from './components/DashboardModalOrchestrator';
import MainLayout from '@/components/templates/MainLayout';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';

import styles from './DashboardPage.module.css';

/**
 * DashboardPage (Orchestrator).
 * Central hub of the application.
 * Decoupled from specific domain modals via DashboardModalOrchestrator.
 */
const DashboardPage = () => {
    const controller = useDashboardController();
    const {
        user, t,
        loading,
        error,
        reminders,
        handlers,
        isAdmin, isSecretary, isDoctor
    } = controller;

    const isAdminOrSecretary = isAdmin || isSecretary;

    const {
        refreshDashboard,
        handleOpenNewRequest,
        handleWhatsAppReminder,
        handleCompleteReminder,
        handleMarkNotified,
        setPaymentModal,
        navigate
    } = handlers;


    if (!user) {
        return <Loading variant="full-page" />;
    }

    const shouldShowLoadingState = loading && !controller.fetched;
    const shouldShowErrorState = Boolean(error) && !controller.fetched;

    return (
        <MainLayout wide flush title={t('dashboard')}>
            <div className={`${styles.dashboardPageOrchestrator} ${styles.animateFadeIn} layout-content-area`}>
                <main className="dashboard-page-orchestrator__main">
                    {shouldShowErrorState ? (
                        <article className={`${styles.bentoCard} ${styles.mainContentCard}`}>
                            <div className={styles.bentoHeader}>
                                <Icon name="error" className={styles.bentoHeaderIcon} />
                                {t('dashboard_error_title')}
                            </div>
                            <p>{t('dashboard_error_message')}</p>
                            <Button variant="premium" size="sm" onClick={refreshDashboard}>
                                <Icon name="refresh" />
                                {t('retry')}
                            </Button>
                        </article>
                    ) : (
                        <div className={styles.bentoGrid}>
                            {/* Stats Overview */}
                            <article className={`${styles.bentoCard} ${styles.statsOverviewCard}`}>
                                <header className={styles.bentoHeader}>
                                    <Icon name="event" className={styles.bentoHeaderIcon} />
                                    {t('appointments')}
                                </header>
                                <div className={styles.statsRow}>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValue}>{controller.stats?.appointments_today || 0}</div>
                                        <div className={styles.statLabel}>{t('today')}</div>
                                    </div>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValue}>{controller.stats?.appointments_week || 0}</div>
                                        <div className={styles.statLabel}>{t('week')}</div>
                                    </div>
                                </div>
                            </article>

                            {/* Patient Growth */}
                            <article className={`${styles.bentoCard} ${styles.patientGrowthCard}`}>
                                <header className={styles.bentoHeader}>
                                    <Icon name="groups" className={styles.bentoHeaderIconPurple} />
                                    {t('patients')}
                                </header>
                                <div className={styles.statsRow}>
                                    <div className={styles.statItem} style={{ flex: 1.5, background: 'transparent', border: 'none', padding: 0 }}>
                                        <div className={styles.statValuePurple}>
                                            {controller.stats?.total_patients || 0}
                                        </div>
                                        <div className={styles.statLabel}>{t('total_active_patients')}</div>
                                        
                                        <div className={styles.chartPlaceholder}>
                                            {[30, 45, 25, 60, 40, 75, 50, 85, 65, 100].map((height, i) => (
                                                <div 
                                                    key={`chart-bar-${i}-${height}`} 
                                                    className={styles.chartBar} 
                                                    style={{ height: `${height}%`, animationDelay: `${i * 0.1}s` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {isAdminOrSecretary && controller.newPatientStats && (
                                        <div className={styles.statItem} style={{ flex: 1 }}>
                                            <div className={styles.statValuePurple} style={{ fontSize: '2rem' }}>
                                                +{controller.newPatientStats.currentDay || 0}
                                            </div>
                                            <div className={styles.statLabel}>{t('new_patients_today')}</div>
                                        </div>
                                    )}
                                </div>
                            </article>

                            {/* Main Content Area (Requirements) */}
                            <article className={`${styles.bentoCard} ${styles.mainContentCard}`}>
                                <header className={styles.bentoHeader} style={{ justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Icon name="description" className={styles.bentoHeaderIcon} />
                                        {t('pending_requests')}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {(isAdminOrSecretary || isDoctor) && (
                                            <Button
                                                variant="premium"
                                                size="sm"
                                                onClick={handleOpenNewRequest}
                                                icon={<Icon name="add_circle" size="1rem" />}
                                            >
                                                {t('new_request')}
                                            </Button>
                                        )}
                                    </div>
                                </header>
                                <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                                    {shouldShowLoadingState ? (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Loading variant="centered" text={t('loading')} />
                                        </div>
                                    ) : (
                                        <div style={{ flex: 1, animation: 'fade-in 0.5s ease' }}>
                                            {isAdminOrSecretary || isDoctor ? (
                                                <MedicalRequirementManager user={user} variant="compact" setPaymentModal={setPaymentModal} />
                                            ) : (
                                                <div className="dashboard-no-permissions" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                                    {t('no_permissions_view')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </article>

                            {/* Reminders Section */}
                            <article className={`${styles.bentoCard} ${styles.remindersCard}`}>
                                <header className={styles.bentoHeader}>
                                    <Icon name="notifications_active" className={styles.bentoHeaderIconPurple} />
                                    {t('dashboard_reminders')}
                                </header>
                                <div style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                                    {shouldShowLoadingState ? (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Loading variant="centered" text={t('loading')} />
                                        </div>
                                    ) : (
                                        <div style={{ flex: 1, animation: 'fade-in 0.5s ease' }}>
                                            {isAdminOrSecretary || isDoctor ? (
                                                <DashboardReminders
                                                    reminders={reminders}
                                                    t={t}
                                                    onWhatsApp={handleWhatsAppReminder}
                                                    onComplete={handleCompleteReminder}
                                                    onMarkNotified={handleMarkNotified}
                                                    onViewProfile={(id) => navigate('/patients', { state: { selectedPatientId: id } })}
                                                />
                                            ) : (
                                                <div className="dashboard-no-permissions" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                                    {t('no_permissions_view')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </article>
                        </div>
                    )}
                </main>
            </div>

            <DashboardModalOrchestrator controller={controller} />
        </MainLayout>
    );
};

export default DashboardPage;
