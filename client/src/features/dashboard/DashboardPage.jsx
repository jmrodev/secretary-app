import React from 'react';
import { useDashboardController } from './hooks/useDashboardController';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardReminders from './components/DashboardReminders';
import QuickActions from './components/QuickActions';
import { PageHeader } from '../layout';
import { PrescriptionModal, MedicalRequirementManager } from '../medical_documents';
import { PatientHistoryModal } from '../patients';
import { TransactionModal } from '../finances';
import heroBg from './assets/dashboard_hero.png'; // Canva-style background


// Internal component from another feature (keeping as is or move to molecules if shared)
import AppointmentActionModal from '../appointments/components/AppointmentActionModal.jsx';

// Global Atomic Components
import MainLayout from '@/components/templates/MainLayout';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Badge from '@/components/atoms/Badge';
import Loading from '@/components/atoms/Loading';

import './DashboardPage.css';

/**
 * DashboardPage (Orchestrator).
 * Central hub of the application.
 */
const DashboardPage = () => {
    const controller = useDashboardController();
    const {
        user, t, settings,
        stats, newPatientStats, reminders, pendingReqCount, activeTab,
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

    if (!user) {
        return <Loading variant="full-page" />;
    }

    const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);

    return (
        <MainLayout wide>
            <section className="dashboard-page-orchestrator">
                <PageHeader 
                    variant="premium"
                    backgroundUrl={heroBg}
                    title={
                        <>
                            {t('dashboard')}
                            <div className="dashboard-live-indicator">
                                <span className="dashboard-live-indicator__dot"></span>
                                <span className="dashboard-live-indicator__text">{t('live') || 'LIVE'}</span>
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
                    <div className="dashboard-top-actions animate-fadeIn">
                        <div className="dashboard-search-bar">
                            <span className="material-symbols-outlined search-icon">search</span>
                            <input type="text" placeholder={t('search_placeholder') || "¿Qué buscar?"} />
                        </div>

                        <Button 
                            variant="premium" 
                            size="sm" 
                            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                            className="dashboard-sidebar-toggle-mobile"
                            title={showMobileSidebar ? t('close_panel') : t('view_metrics')}
                        >
                            <Icon name={showMobileSidebar ? 'expand_less' : 'analytics'} />
                            <span className="mobile-only-label">
                                {showMobileSidebar ? t('close_panel') : t('view_metrics')}
                            </span>
                        </Button>
                    </div>

                    <div className={`dashboard-grid ${showMobileSidebar ? 'dashboard-grid--sidebar-visible' : ''}`}>
                        {/* Mobile Overlay / Backdrop */}
                        {showMobileSidebar && (
                            <div 
                                className="dashboard-mobile-backdrop" 
                                onClick={() => setShowMobileSidebar(false)}
                            />
                        )}

                        {/* Sidebar: Utils & Metrics (Drawer on Mobile) */}
                        <aside className="dashboard-sidebar">
                            <div className="dashboard-sidebar-mobile-header">
                                <h3 className="dashboard-sidebar-mobile-header__title">
                                    <Icon name="analytics" /> {t('metrics_and_tools') || 'Métricas y Herramientas'}
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
                            
                            {/* QuickActions moved here as a support element */}
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
                        </aside>

                        {/* Main Area: Priority Content */}
                        <main className="dashboard-main">
                            <article className="dashboard-card dashboard-card--no-padding dashboard-card--priority">
                                <div className="dashboard-card__content">
                                    {(isAdminOrSecretary || isDoctor) ? (
                                        <div className="dashboard-requirements">
                                            <header className="dashboard-requirements__header">
                                                <h3 className="dashboard-requirements__title">
                                                    <Icon name="description" size="1.5rem" />
                                                    {t('pending_requests')}
                                                </h3>
                                                
                                                <div className="dashboard-header-actions">
                                                    {/* Secondary tab if someone really needs reminders */}
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
                        </main>
                    </div>

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
            </section>
        </MainLayout>
    );

};

export default DashboardPage;
