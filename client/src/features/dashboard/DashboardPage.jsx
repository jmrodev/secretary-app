import React from 'react';
import { useDashboardController } from './hooks/useDashboardController';
import DashboardReminders from '@/features/dashboard/components/DashboardReminders';
import MedicalRequirementManager from '@/features/medical_documents/components/ui/MedicalRequirementManager';
import AppointmentActionModal from '@/features/appointments/components/modals/AppointmentActionModal';
import PrescriptionModal from '@/features/medical_documents/components/modals/PrescriptionModal';
import PatientHistoryModal from '@/features/patients/components/modals/PatientHistoryModal';
import TransactionModal from '@/features/finances/components/modals/TransactionModal';
import MedicalRequestModal from '@/features/medical_documents/components/modals/MedicalRequestModal';
import MainLayout from '@/components/templates/MainLayout';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import CashMonitorCard from './components/CashMonitorCard';

import styles from './DashboardPage.module.css';

/**
 * DashboardPage (ECC-Pattern Orchestrator).
 * Optimized dashboard with full metrics and real-time monitoring.
 */
const DashboardPage = () => {
    const controller = useDashboardController();
    const {
        user, t, loading, error, reminders,
        actionModal, historyModal, prescribeModal, paymentModal, newRequestModal,
        doctors, handlers, isAdmin, isSecretary, isDoctor
    } = controller;

    const isAdminOrSecretary = isAdmin || isSecretary;
    const { refreshDashboard, handleOpenNewRequest, setActionModal, setHistoryModal, setPrescribeModal, setPaymentModal, setNewRequestModal, navigate } = handlers;

    if (!user) return <Loading variant="full-page" />;

    const shouldShowLoadingState = loading && !controller.fetched;
    const shouldShowErrorState = Boolean(error) && !controller.fetched;

    return (
        <MainLayout wide flush title={t('dashboard')}>
            <div className={`${styles.dashboardPageOrchestrator} ${styles.animateFadeIn}`}>
                <main className="dashboard-page-orchestrator__main">
                    {shouldShowErrorState ? (
                        <article className={`${styles.bentoCard} ${styles.mainContentCard}`}>
                            <div className={styles.bentoHeader}><Icon name="error" /> Error</div>
                            <p>{t('dashboard_error_message')}</p>
                            <Button variant="premium" size="sm" onClick={refreshDashboard} icon={<Icon name="refresh" />}>{t('retry')}</Button>
                        </article>
                    ) : (
                        <div className={styles.bentoGrid}>
                            
                            {/* Card 1: Cash Monitor (Theoretical vs Actual) */}
                            <CashMonitorCard stats={controller.stats?.financeStats || controller.financeStats} t={t} />

                            {/* Card 2: Appointments Overview (Day, Week, Month, Total) */}
                            <article className={`${styles.bentoCard} ${styles.statsOverviewCard}`}>
                                <header className={styles.bentoHeader}>
                                    <Icon name="calendar_today" className={styles.bentoHeaderIcon} />
                                    {t('appointments')}
                                </header>
                                <div className={styles.statsRow}>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValue}>{controller.stats?.appointments?.today?.count || 0}</div>
                                        <div className={styles.statLabel}>{t('this_day')}</div>
                                    </div>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValue}>{controller.stats?.appointments?.week?.count || 0}</div>
                                        <div className={styles.statLabel}>{t('view_week')}</div>
                                    </div>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValue}>{controller.stats?.appointments?.month?.count || 0}</div>
                                        <div className={styles.statLabel}>{t('date_range')}</div>
                                    </div>
                                </div>
                            </article>

                            {/* Card 3: Patient Metrics */}
                            <article className={`${styles.bentoCard} ${styles.patientGrowthCard}`}>
                                <header className={styles.bentoHeader}>
                                    <Icon name="trending_up" className={styles.bentoHeaderIconPurple} />
                                    {t('patients')}
                                </header>
                                <div className={styles.statsRow}>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValuePurple}>{controller.stats?.total_patients || 0}</div>
                                        <div className={styles.statLabel}>{t('total_active_patients')}</div>
                                    </div>
                                    {isAdminOrSecretary && (
                                        <div className={styles.statItem}>
                                            <div className={styles.statValuePurple} style={{ fontSize: '1.8rem' }}>
                                                +{controller.newPatientStats?.currentDay || 0}
                                            </div>
                                            <div className={styles.statLabel}>{t('new_patients_today')}</div>
                                        </div>
                                    )}
                                </div>
                            </article>

                            {/* Card 4: Main Activity Area (Requirements) */}
                            <article className={`${styles.bentoCard} ${styles.mainContentCard}`}>
                                <header className={styles.bentoHeader} style={{ justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Icon name="description" className={styles.bentoHeaderIcon} />
                                        {t('pending_requests')}
                                    </div>
                                    {(isAdminOrSecretary || isDoctor) && (
                                        <Button variant="premium" size="sm" onClick={handleOpenNewRequest} icon={<Icon name="add_circle" />}>
                                            {t('new_request')}
                                        </Button>
                                    )}
                                </header>
                                <div style={{ minHeight: '350px' }}>
                                    {shouldShowLoadingState ? <Loading variant="centered" /> : (
                                        <MedicalRequirementManager user={user} variant="compact" setPaymentModal={setPaymentModal} />
                                    )}
                                </div>
                            </article>

                            {/* Card 5: Smart Reminders */}
                            <article className={`${styles.bentoCard} ${styles.remindersCard}`}>
                                <header className={styles.bentoHeader}>
                                    <Icon name="notifications_active" className={styles.bentoHeaderIconPurple} />
                                    {t('dashboard_reminders')}
                                </header>
                                {shouldShowLoadingState ? <Loading variant="centered" /> : (
                                    <DashboardReminders
                                        reminders={reminders} t={t}
                                        onWhatsApp={handlers.handleWhatsAppReminder}
                                        onComplete={handlers.handleCompleteReminder}
                                        onMarkNotified={handlers.handleMarkNotified}
                                        onViewProfile={(id) => navigate('/patients', { state: { selectedPatientId: id } })}
                                    />
                                )}
                            </article>
                        </div>
                    )}
                </main>
            </div>

            <AppointmentActionModal
                isOpen={actionModal.open} onClose={() => setActionModal(p => ({ ...p, open: false }))}
                appt={actionModal.appt} doctors={doctors} onUpdateStatus={handlers.handleUpdateStatus}
                onDelete={handlers.handleDelete} onCancel={handlers.handleCancel} onPay={handlers.handleOpenPayment}
                onWhatsApp={handlers.handleWhatsApp} onUpdateType={handlers.handleUpdateType}
                onHardEdit={handlers.handleHardEdit} onHistory={handlers.handleOpenHistory}
                onPrescribe={handlers.handleOpenPrescribe} onReschedule={handlers.handleOpenReschedule}
                onSync={handlers.handleOpenSync} onSaveNote={handlers.handleSaveNote} fetchAppointments={refreshDashboard}
            />
            <MedicalRequestModal 
                isOpen={newRequestModal.open} onClose={() => setNewRequestModal({ open: false })}
                doctors={doctors} t={t} onRequestCreated={refreshDashboard}
            />
            {prescribeModal.open && (
                <PrescriptionModal
                    isOpen={prescribeModal.open} onClose={() => setPrescribeModal(p => ({ ...p, open: false }))}
                    patientName={prescribeModal.patientName} patientId={prescribeModal.patientId}
                    onSubmit={handlers.handlePrescriptionSubmit} t={t} isSubmitting={controller.isSubmitting}
                />
            )}
            {historyModal.open && (
                <PatientHistoryModal
                    isOpen={historyModal.open} onClose={() => setHistoryModal(p => ({ ...p, open: false }))}
                    patientId={historyModal.patientId} patientName={historyModal.patientName}
                />
            )}
            {paymentModal.open && (
                <TransactionModal
                    isOpen={paymentModal.open} onClose={() => setPaymentModal(p => ({ ...p, open: false }))}
                    initialData={{ ...paymentModal.initialData, appointment_id: paymentModal.apptId || paymentModal.initialData?.apptId }}
                    requestId={paymentModal.reqId || paymentModal.initialData?.reqId}
                    onSuccess={async () => { refreshDashboard(); setPaymentModal(p => ({ ...p, open: false })); }}
                    t={t}
                />
            )}
        </MainLayout>
    );
};

export default DashboardPage;
