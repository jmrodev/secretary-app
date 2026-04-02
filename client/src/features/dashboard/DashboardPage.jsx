import React from 'react';
import { 
    useDashboardController, 
    DashboardSidebar, 
    DashboardReminders 
} from './index'; // Local index
import { PageHeader } from '../layout';
import { PrescriptionModal, MedicalRequirementManager } from '../medical_documents';
import { PatientHistoryModal } from '../patients';
import { TransactionModal } from '../finances';

// Internal component from another feature (keeping as is or move to molecules if shared)
import AppointmentActionModal from '../appointments/components/AppointmentActionModal.jsx';

// Global Atomic Components
import MainLayout from '../../components/templates/MainLayout';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';
import Badge from '../../components/atoms/Badge';
import Loading from '../../components/atoms/Loading';

import './DashboardPage.css';

/**
 * DashboardPage (Orchestrator).
 * Central hub of the application.
 */
const DashboardPage = () => {
    const controller = useDashboardController();
    const {
        user, t, settings,
        stats, newPatientStats, reminders, pendingReqCount, activeTab, setActiveTab,
        actionModal, setActionModal,
        historyModal, setHistoryModal,
        prescribeModal, setPrescribeModal,
        paymentModal, setPaymentModal,
        isSubmitting,
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
        navigate,
        doctors
    } = controller;

    if (!user) {
        return <Loading variant="full-page" />;
    }

    const isAdminOrSecretary = user.role === 'admin' || user.role === 'secretary';
    const isDoctor = user.role === 'doctor';

    return (
        <div className="dashboard-page-orchestrator">
            <div className="dashboard-page">
                <PageHeader 
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
                            {t('welcome_back')}, <strong>{user.full_name || user.username}</strong>. {t('dashboard_subtitle')}
                        </>
                    }
                />

                <div className="dashboard-grid animate-fadeIn">
                    {/* Sidebar Stats */}
                    <aside className="dashboard-sidebar">
                        <DashboardSidebar
                            stats={stats}
                            newPatientStats={newPatientStats}
                            user={user}
                            t={t}
                        />
                    </aside>

                    {/* Main Content Area */}
                    <main className="dashboard-main">
                        {(isAdminOrSecretary || isDoctor) && (
                            <div className="dashboard-nav-bar dashboard-nav-bar--centered mb-6">
                                <div className="flex items-center gap-6">
                                    <div className="dashboard-nav-bar__button-wrapper">
                                        <Button
                                            variant="ghost"
                                            active={activeTab === 'requirements'}
                                            onClick={() => setActiveTab('requirements')}
                                            icon={<Icon name="description" size="1.2rem" />}
                                            className="px-6"
                                        >
                                            {t('ongoing_requirements')}
                                        </Button>
                                        <Badge count={pendingReqCount} position="top-right" />
                                    </div>
                                    <div className="dashboard-nav-bar__button-wrapper">
                                        <Button
                                            variant="ghost"
                                            active={activeTab === 'reminders'}
                                            onClick={() => setActiveTab('reminders')}
                                            icon={<Icon name="notifications" size="1.2rem" />}
                                            className="px-6"
                                        >
                                            {t('reminders')}
                                        </Button>
                                        <Badge count={reminders.length} position="top-right" variant="danger" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="dashboard-card no-padding">
                            <div className="dashboard-card__content">
                                {activeTab === 'requirements' && (isAdminOrSecretary || isDoctor) && (
                                    <div className="dashboard-requirements">
                                        <div className="dashboard-requirements__header">
                                            <h3 className="dashboard-requirements__title">
                                                <Icon name="description" size="1.2rem" />
                                                {t('pending_requests')}
                                            </h3>
                                        </div>
                                        <MedicalRequirementManager user={user} hideTabs={true} hideFilters={true} setPaymentModal={setPaymentModal} />
                                    </div>
                                )}

                                {activeTab === 'reminders' && (
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
                        </div>
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
            </div>
        </div>
    );
};

export default DashboardPage;
