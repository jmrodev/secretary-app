import React from 'react';
import { 
    useDashboardController, 
    DashboardSidebar, 
    DashboardReminders,
    QuickActions
} from './index'; // Local index
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

    const isAdminOrSecretary = isStaff;

    return (
        <MainLayout wide>
            <section className="dashboard-page-orchestrator">
                <header className="dashboard-hero">
                    <div className="dashboard-hero__background" style={{ backgroundImage: `url(${heroBg})` }}></div>
                    <div className="dashboard-hero__content">
                        <PageHeader 
                            className="dashboard-header--premium"
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
                        <div className="dashboard-hero__search">
                            <div className="dashboard-search-bar">
                                <Icon name="search" />
                                <input type="text" placeholder={t('search_placeholder') || "¿Qué quieres buscar hoy?"} />
                                <Badge variant="info">CMS</Badge>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="dashboard-page">

                    <div className="dashboard-grid animate-fadeIn">
                        {/* Sidebar: Utils & Metrics */}
                        <aside className="dashboard-sidebar">
                            <DashboardSidebar
                                stats={stats}
                                newPatientStats={newPatientStats}
                                user={user}
                                t={t}
                            />
                            
                            {/* QuickActions moved here as a support element */}
                            {(isAdmin || isSecretary || isDoctor) && (
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
                                            <header className="dashboard-requirements__header flex justify-between items-center mb-4">
                                                <h3 className="dashboard-requirements__title flex items-center gap-2">
                                                    <Icon name="description" size="1.5rem" />
                                                    {t('pending_requests')}
                                                </h3>
                                                {/* Secondary tab if someone really needs reminders */}
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setActiveTab(activeTab === 'reminders' ? 'requirements' : 'reminders')}
                                                >
                                                    {activeTab === 'reminders' ? t('back_to_requests') : `${t('view_reminders')} (${reminders?.length || 0})`}
                                                </Button>
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
                                        <div className="p-8 text-center text-muted">
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
