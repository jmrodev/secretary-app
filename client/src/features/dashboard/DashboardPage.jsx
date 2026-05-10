import React from 'react';
import { useDashboardController } from '@/features/dashboard/index';
import DashboardReminders from '@/features/dashboard/components/DashboardReminders';
import MedicalRequirementManager from '@/features/medical_documents/components/MedicalRequirementManager';
import AppointmentActionModal from '@/features/appointments/components/AppointmentActionModal';
import PrescriptionModal from '@/features/medical_documents/components/PrescriptionModal';
import PatientHistoryModal from '@/features/patients/components/PatientHistoryModal';
import TransactionModal from '@/features/finances/components/TransactionModal';
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
        stats, reminders, activeTab,
        actionModal,
        historyModal,
        prescribeModal,
        paymentModal,
        isSubmitting,
        doctors,
        handlers,
        isAdmin, isSecretary, isDoctor
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

    const handleSearchSubmit = (event) => {
        event.preventDefault();
    };

    if (!user) {
        return <Loading variant="full-page" />;
    }

    const hasLoadedStats = (
        stats !== null &&
        stats !== undefined &&
        typeof stats === 'object' &&
        Object.keys(stats).length > 0
    );
    const hasLoadedReminders = Array.isArray(reminders) && (reminders.length > 0 || !loading);
    const shouldShowLoadingState = loading && !controller.fetched;
    const shouldShowErrorState = Boolean(error) && !controller.fetched;



    return (
        <MainLayout wide flush title={t('dashboard')} hideTitle>
            <main className="dashboard-page-orchestrator">
                <section className="layout-content-area">
                    
                    {shouldShowLoadingState ? (
                        <Loading variant="centered" text={t('loading')} />
                    ) : shouldShowErrorState ? (
                        <article className="dashboard-page-orchestrator__state-card">
                            <h3>{t('dashboard_error_title')}</h3>
                            <p>{t('dashboard_error_message')}</p>
                            <Button variant="premium" size="sm" onClick={refreshDashboard}>
                                <Icon name="refresh" />
                                {t('retry')}
                            </Button>
                        </article>
                    ) : (
                        <div className="dashboard-page-orchestrator__full-wrapper animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {/* Main Functional Area */}
                            <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <article className="dashboard-card dashboard-page-orchestrator__priority-card">
                                    <div className="dashboard-page-orchestrator__requirements">
                                        <header className="dashboard-page-orchestrator__requirements-header">
                                            <h3 className="dashboard-page-orchestrator__requirements-title">
                                                <Icon name={activeTab === 'reminders' ? 'notifications_active' : 'description'} size="1.5rem" />
                                                {activeTab === 'reminders' ? t('dashboard_reminders') : t('pending_requests')}
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

                                        <div className="dashboard-page-orchestrator__requirements-content">
                                            {isAdminOrSecretary || isDoctor ? (
                                                activeTab === 'requirements' ? (
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
                                                )
                                            ) : (
                                                <div className="dashboard-no-permissions">
                                                    {t('no_permissions_view')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            </section>
                        </div>
                    )}
                </section>

                {/* Modals */}
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
            </main>
        </MainLayout>
    );

};

export default DashboardPage;
