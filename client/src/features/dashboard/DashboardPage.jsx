import React from 'react';
import { 
    useDashboardController, 
    DashboardSidebar, 
    DashboardReminders,
    QuickActions,
    DashboardLayout
} from '@/features/dashboard/index'; // Local index
import { PageHeader } from '@/features/layout';
import { PrescriptionModal, MedicalRequirementManager } from '@/features/medical_documents';
import { PatientHistoryModal } from '@/features/patients';
import { TransactionModal } from '@/features/finances';
import heroBg from './assets/dashboard_hero.png'; // Canva-style background


// Internal component from another feature (keeping as is or move to molecules if shared)
import AppointmentActionModal from '@/features/appointments/components/AppointmentActionModal.jsx';

// Global Atomic Components
import MainLayout from '@/components/templates/MainLayout';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';

import './DashboardPage.css';

/**
 * DashboardPage (Orchestrator).
 * Central hub of the application.
 */
const DashboardPage = () => {
    const controller = useDashboardController();
    const {
        user, t,
        loading,
        error,
        stats, newPatientStats, reminders, activeTab,
        actionModal,
        historyModal,
        prescribeModal,
        paymentModal,
        isSubmitting,
        doctors,
        handlers,
        isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff
    } = controller;

    const isAdminOrSecretary = isAdmin || isSecretary;

    const {
        refreshDashboard,
        handleUpdateStatus,
        handleDelete,
        handleCancel,
        handleWhatsApp,
        handlePrescriptionSubmit,
        handleOpenPayment,
        handleOpenHistory,
        handleOpenPrescribe,
        handleOpenReschedule,
        handleOpenSync,
        handleUpdateType,
        handleHardEdit,
        handleSaveNote,
        handleCompleteReminder,
        handleWhatsAppReminder,
        handleMarkNotified,
        setActiveTab,
        setActionModal,
        setHistoryModal,
        setPrescribeModal,
        setPaymentModal,
        navigate
    } = handlers;

    const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);
    const handleSearchSubmit = (event) => {
        event.preventDefault();
    };

    if (!user) {
        return <Loading variant="full-page" />;
    }

    const hasLoadedStats = (
        !loading &&
        stats !== null &&
        stats !== undefined &&
        typeof stats === 'object' &&
        Object.keys(stats).length > 0
    );
    const hasLoadedReminders = Array.isArray(reminders) && reminders.length > 0;
    const hasDashboardData = hasLoadedStats || hasLoadedReminders;
    const shouldShowLoadingState = loading && !hasDashboardData;
    const shouldShowErrorState = Boolean(error) && !hasDashboardData;

    return (
        <MainLayout wide>
            <main className="dashboard-page-orchestrator">
                <PageHeader 
                    variant="premium"
                    backgroundUrl={heroBg}
                    title={
                        <>
                            {t('dashboard')}
                            <div className="dashboard-live-indicator">
                                <span className="dashboard-live-indicator__dot"></span>
                                <span className="dashboard-live-indicator__text">{t('live')}</span>
                            </div>
                        </>
                    }
                    subtitle={
                        <>
                            {t('welcome_back')}, <strong>{user?.full_name || user?.username}</strong>. {t('dashboard_subtitle')}
                        </>
                    }
                />
                <section className="layout-content-area">
                    <h2 className="visually-hidden">{t('dashboard_content')}</h2>
                    {shouldShowLoadingState ? (
                        <section className="dashboard-page-orchestrator__state dashboard-page-orchestrator__state--loading" aria-live="polite">
                            <Loading variant="centered" text={t('loading')} />
                        </section>
                    ) : shouldShowErrorState ? (
                        <section className="dashboard-page-orchestrator__state dashboard-page-orchestrator__state--error" aria-live="polite">
                            <article className="dashboard-page-orchestrator__state-card">
                                <h3 className="dashboard-page-orchestrator__state-title">{t('dashboard_error_title')}</h3>
                                <p className="dashboard-page-orchestrator__state-message">{t('dashboard_error_message')}</p>
                                <Button variant="premium" size="sm" onClick={refreshDashboard}>
                                    <Icon name="refresh" />
                                    {t('retry')}
                                </Button>
                            </article>
                        </section>
                    ) : (
                    <DashboardLayout
                        t={t}
                        showMobileSidebar={showMobileSidebar}
                        onToggleSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
                        onCloseSidebar={() => setShowMobileSidebar(false)}
                        searchSlot={(
                            <form className="dashboard-search-bar" role="search" onSubmit={handleSearchSubmit}>
                                <Icon name="search" className="dashboard-search-bar__icon" />
                                <input
                                    type="text"
                                    className="dashboard-search-bar__input"
                                    placeholder={t('search_placeholder')}
                                    aria-label={t('search_placeholder')}
                                />
                            </form>
                        )}
                        sidebarSlot={(
                            <>
                                <div className="dashboard-sidebar-mobile-header">
                                    <h3 className="dashboard-sidebar-mobile-header__title">
                                        <Icon name="analytics" /> {t('metrics_and_tools')}
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => setShowMobileSidebar(false)}>
                                        <Icon name="close" />
                                    </Button>
                                </div>

                                <DashboardSidebar
                                    stats={stats}
                                    newPatientStats={newPatientStats}
                                    user={user}
                                    t={t}
                                />

                                {(isAdminOrSecretary || isDoctor) && (
                                    <QuickActions
                                        t={t}
                                        handlers={handlers}
                                        isAdmin={isAdmin}
                                        isSecretary={isSecretary}
                                        isDoctor={isDoctor}
                                        compact={true}
                                    />
                                )}
                            </>
                        )}
                        mainSlot={(
                            <article className="dashboard-card dashboard-card--no-padding dashboard-card--priority">
                                <h3 className="visually-hidden">{t('main_dashboard_priority')}</h3>
                                <div className="dashboard-card__content">
                                    {(isAdminOrSecretary || isDoctor) ? (
                                        <div className="dashboard-requirements">
                                            <header className="dashboard-requirements__header">
                                                <h3 className="dashboard-requirements__title">
                                                    <Icon name="description" size="1.5rem" />
                                                    {t('pending_requests')}
                                                </h3>

                                                <div className="dashboard-page-orchestrator__header-actions">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setActiveTab(activeTab === 'reminders' ? 'requirements' : 'reminders')}
                                                    >
                                                        {activeTab === 'reminders' ? t('back_to_requests') : `${t('view_reminders')} (${reminders?.length || 0})`}
                                                    </Button>
                                                </div>
                                            </header>

                                            {activeTab === 'requirements' ? (
                                                <MedicalRequirementManager user={user} hideTabs={true} hideFilters={true} setPaymentModal={setPaymentModal} />
                                            ) : (
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
                                    ) : (
                                        <div className="dashboard-no-permissions">
                                            {t('no_permissions_view')}
                                        </div>
                                    )}
                                </div>
                            </article>
                        )}
                    />
                    )}

                    {/* Modals - Orchestrated by Dashboard Controller but located in their respective features */}
                    <AppointmentActionModal
                        isOpen={actionModal.open}
                        onClose={() => setActionModal({ ...actionModal, open: false })}
                        appt={actionModal.appt}
                        doctors={doctors}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDelete}
                        onCancel={handleCancel}
                        onPay={handleOpenPayment}
                        onWhatsApp={handleWhatsApp}
                        onUpdateType={handleUpdateType}
                        onHardEdit={handleHardEdit}
                        onHistory={handleOpenHistory}
                        onPrescribe={handleOpenPrescribe}
                        onReschedule={handleOpenReschedule}
                        onSync={handleOpenSync}
                        onSaveNote={handleSaveNote}
                        fetchAppointments={refreshDashboard}
                    />

                    <PrescriptionModal
                        isOpen={prescribeModal.open}
                        onClose={() => setPrescribeModal({ ...prescribeModal, open: false })}
                        patientName={prescribeModal.patientName}
                        onSubmit={handlePrescriptionSubmit}
                        t={t}
                        isSubmitting={isSubmitting}
                    />

                    <PatientHistoryModal
                        isOpen={historyModal.open}
                        onClose={() => setHistoryModal({ ...historyModal, open: false })}
                        patientId={historyModal.patientId}
                        patientName={historyModal.patientName}
                    />

                    <TransactionModal
                        isOpen={paymentModal.open}
                        onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                        initialData={{
                            ...paymentModal.initialData,
                            appointment_id: paymentModal.apptId || paymentModal.initialData?.apptId
                        }}
                        requestId={paymentModal.reqId || paymentModal.initialData?.reqId}
                        onSuccess={async () => {
                            refreshDashboard();
                        }}
                    />
                </section>
            </main>
        </MainLayout>
    );

};

export default DashboardPage;
