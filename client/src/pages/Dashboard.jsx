import React from 'react';
import { useDashboardController } from '../controllers/useDashboardController';
import Button from '../components/atoms/Button';
import Icon from '../components/atoms/Icon';
import Badge from '../components/atoms/Badge';
import RequirementsList from '../components/organisms/RequirementsList';
import DashboardSidebar from '../components/organisms/DashboardSidebar';
import DashboardReminders from '../components/organisms/DashboardReminders';
import AppointmentActionModal from '../components/organisms/AppointmentActionModal';
import PrescriptionModal from '../components/organisms/PrescriptionModal';
import PatientHistoryModal from '../components/molecules/PatientHistoryModal';
import TransactionModal from '../components/molecules/TransactionModal';
import MainLayout from '../components/templates/MainLayout';
import Loading from '../components/atoms/Loading';
import './Dashboard.css';

/**
 * Dashboard Page.
 * Central hub of the application.
 */
const Dashboard = () => {
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
        navigate
    } = controller;

    if (!user) {
        return <Loading variant="full-page" />;
    }

    const isAdminOrSecretary = user.role === 'admin' || user.role === 'secretary';
    const isDoctor = user.role === 'doctor';

    return (
        <MainLayout wide>
            <div className="dashboard-page">
                <header className="dashboard-header animate-fadeIn">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="dashboard-header__title">{t('dashboard')}</h1>
                            <div className="dashboard-live-indicator">
                                <span className="dashboard-live-indicator__dot"></span>
                                <span className="dashboard-live-indicator__text">LIVE</span>
                            </div>
                        </div>
                        <p className="dashboard-header__subtitle">
                            {t('welcome_back')}, <strong>{user.full_name || user.username}</strong>. {t('dashboard_subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            outline
                            size="sm"
                            onClick={refreshDashboard}
                            icon={<Icon name="SYNC" size="1.1rem" />}
                            tooltip={t('refresh')}
                        />
                        {isAdminOrSecretary && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate('/patients', { state: { openNewPatient: true } })}
                                icon={<Icon name="ADD" size="1.1rem" />}
                            >
                                {t('new_patient')}
                            </Button>
                        )}
                    </div>
                </header>

                <div className="dashboard-grid animate-fadeIn">
                    {/* Sidebar Stats */}
                    <aside className="dashboard-sidebar">
                        <DashboardSidebar
                            stats={stats}
                            newPatientStats={newPatientStats}
                            reminders={[]} // No longer show reminders here
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
                                            icon={<Icon name="DOCS" />}
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
                                            icon={<Icon name="NOTIFICATIONS" />}
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
                                            <h3 className="dashboard-requirements__title">{t('pending_requests')}</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate('/requests')}
                                                className="dashboard-requirements__view-all"
                                            >
                                                {t('view_all')}
                                                <Icon name="arrow_forward" size="1rem" />
                                            </Button>
                                        </div>
                                        <RequirementsList user={user} />
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

                {/* Modals */}
                <AppointmentActionModal
                    isOpen={actionModal.open}
                    onClose={() => setActionModal({ ...actionModal, open: false })}
                    appt={actionModal.appt}
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
                    initialData={paymentModal.initialData}
                    onSuccess={async () => {
                        refreshDashboard();
                    }}
                />
            </div>
        </MainLayout>
    );
};

export default Dashboard;
