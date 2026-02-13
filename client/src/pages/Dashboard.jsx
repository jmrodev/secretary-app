
import React from 'react';
import { useDashboardController } from '../controllers/useDashboardController';
import Button from '../components/atoms/Button';
import Icon from '../components/atoms/Icon';
import RequirementsList from '../components/organisms/RequirementsList';
import DashboardSidebar from '../components/organisms/DashboardSidebar';
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
        navigate
    } = controller;

    if (!user) {
        return <Loading variant="full-page" />;
    }

    return (
        <MainLayout wide>
            <div className="dashboard-page">
                <header className="dashboard-header animate-fadeIn">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="dashboard-header__title">{t('dashboard') || 'Panel de Control'}</h1>
                            <div className="dashboard-live-indicator">
                                <span className="dashboard-live-indicator__dot"></span>
                                <span className="dashboard-live-indicator__text">LIVE</span>
                            </div>
                        </div>
                        <p className="dashboard-header__subtitle">
                            {t('welcome_back') || 'Hola'}, <strong>{user.full_name || user.username}</strong>. {t('dashboard_subtitle') || 'Aquí tienes un resumen de la actividad de hoy.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            outline
                            size="sm"
                            onClick={refreshDashboard}
                            icon={<Icon name="SYNC" size="1.1rem" />}
                            tooltip={t('refresh') || 'Sincronizar Panel'}
                        />
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate('/patients', { state: { openNewPatient: true } })}
                                icon={<Icon name="ADD" size="1.1rem" />}
                            >
                                {t('new_patient') || 'Nuevo Paciente'}
                            </Button>
                        )}
                    </div>
                </header>

                <div className="dashboard-grid animate-fadeIn">
                    {/* Sidebar Stats - Now on the left consistent with 380px fixed width */}
                    <aside className="dashboard-sidebar">
                        <DashboardSidebar
                            stats={stats}
                            newPatientStats={newPatientStats}
                            reminders={reminders}
                            user={user}
                            t={t}
                        />
                    </aside>

                    {/* Main Content Area - Primary focus, takes remaining 1fr */}
                    <main className="dashboard-main">
                        {(user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                            <div className="dashboard-nav-bar dashboard-nav-bar--centered mb-6">
                                <div className="flex items-center gap-6">
                                    <Button
                                        variant="ghost"
                                        active={activeTab === 'requirements'}
                                        onClick={() => setActiveTab('requirements')}
                                        icon={<Icon name="DOCS" />}
                                        className="relative"
                                    >
                                        {t('ongoing_requirements')}
                                        {pendingReqCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                                                {pendingReqCount}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="dashboard-card no-padding">
                            <div className="p-6">
                                {activeTab === 'requirements' && (user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                                    <div className="dashboard-requirements">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-slate-800">{t('pending_requests') || 'Solicitudes Pendientes'}</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate('/requests')}
                                                className="text-primary hover:bg-primary/5"
                                            >
                                                {t('view_all')}
                                                <Icon name="arrow_forward" size="1rem" className="ml-1" />
                                            </Button>
                                        </div>
                                        <RequirementsList user={user} />
                                    </div>
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
