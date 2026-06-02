import React from 'react';
import { useDashboardController } from './hooks/useDashboardController';
import DashboardReminders from '@/features/dashboard/components/DashboardReminders';
import MedicalRequirementManager from '@/features/medical_documents/components/ui/MedicalRequirementManager';
import AppointmentActionModal from '@/features/appointments/components/modals/AppointmentActionModal';
import PrescriptionModal from '@/features/medical_documents/components/modals/PrescriptionModal';
import PatientHistoryModal from '@/features/patients/components/modals/PatientHistoryModal';
import TransactionModal from '@/features/finances/components/modals/TransactionModal';
import MainLayout from '@/components/templates/MainLayout';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import FeatureToolbar from '@/components/organisms/FeatureToolbar';

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
        reminders, activeTab,
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


    if (!user) {
        return <Loading variant="full-page" />;
    }

    const shouldShowLoadingState = loading && !controller.fetched;
    const shouldShowErrorState = Boolean(error) && !controller.fetched;



    return (
        <MainLayout wide flush title={t('dashboard')}>
            <div className="dashboard-page-orchestrator layout-content-area animate-fade-in">
                <FeatureToolbar
                    className="dashboard-page-orchestrator__toolbar"
                    tabs={[
                        { id: 'requirements', label: t('pending_requests'), icon: 'description' },
                        { id: 'reminders', label: t('dashboard_reminders'), icon: 'notifications_active' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    actions={
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={refreshDashboard}
                            icon={<Icon name="refresh" size="1rem" />}
                        >
                            {t('refresh')}
                        </Button>
                    }
                />

                <main className="dashboard-page-orchestrator__main">
                    {shouldShowErrorState ? (
                        <article className="dashboard-page-orchestrator__state-card">
                            <h3>{t('dashboard_error_title')}</h3>
                            <p>{t('dashboard_error_message')}</p>
                            <Button variant="premium" size="sm" onClick={refreshDashboard}>
                                <Icon name="refresh" />
                                {t('retry')}
                            </Button>
                        </article>
                    ) : (
                        <div className="dashboard-page-orchestrator__content">
                            <article className="dashboard-card no-padding">
                                <div className="dashboard-page-orchestrator__view-container">
                                    {shouldShowLoadingState ? (
                                        <Loading variant="centered" text={t('loading')} />
                                    ) : (
                                        <div className="dashboard-page-orchestrator__view-content">
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
                                    )}
                                </div>
                            </article>
                        </div>
                    )}
                </main>
            </div>

            {/* Modals */}
            <AppointmentActionModal
                isOpen={actionModal.open}
                onClose={() => setActionModal(prev => ({ ...prev, open: false }))}
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

            {prescribeModal.open && (
                <PrescriptionModal
                    isOpen={prescribeModal.open}
                    onClose={() => setPrescribeModal(prev => ({ ...prev, open: false }))}
                    patientName={prescribeModal.patientName}
                    patientId={prescribeModal.patientId}
                    onSubmit={handlePrescriptionSubmit}
                    t={t}
                    isSubmitting={isSubmitting}
                />
            )}

            {historyModal.open && (
                <PatientHistoryModal
                    isOpen={historyModal.open}
                    onClose={() => setHistoryModal(prev => ({ ...prev, open: false }))}
                    patientId={historyModal.patientId}
                    patientName={historyModal.patientName}
                />
            )}

            {paymentModal.open && (
                <TransactionModal
                    isOpen={paymentModal.open}
                    onClose={() => setPaymentModal(prev => ({ ...prev, open: false }))}
                    initialData={{
                        ...paymentModal.initialData,
                        appointment_id: paymentModal.apptId || paymentModal.initialData?.apptId
                    }}
                    requestId={paymentModal.reqId || paymentModal.initialData?.reqId}
                    onSuccess={async () => {
                        refreshDashboard();
                        setPaymentModal(prev => ({ ...prev, open: false }));
                    }}
                    t={t}
                />
            )}
        </MainLayout>
    );
};

export default DashboardPage;
