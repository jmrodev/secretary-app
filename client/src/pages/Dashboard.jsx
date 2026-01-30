
import React from 'react';
import { useDashboardController } from '../controllers/useDashboardController';
import Button from '../components/atoms/Button';
import Sidebar from '../components/organisms/Sidebar';
import RequirementsList from '../components/organisms/RequirementsList';
import DashboardSidebar from '../components/organisms/DashboardSidebar';
import AppointmentActionModal from '../components/organisms/AppointmentActionModal';
import PrescriptionModal from '../components/organisms/PrescriptionModal';
import PatientHistoryModal from '../components/molecules/PatientHistoryModal';
import TransactionModal from '../components/molecules/TransactionModal';
import './Dashboard.css';

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
        return (
            <div className="centered-loader">
                <div className="status-display__spinner"></div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="dashboard">
                <header className="dashboard__header">
                    <div className="dashboard__header-info">
                        <h1 className="dashboard__title">{t('dashboard') || 'Panel de Control'}</h1>
                        <p className="dashboard__subtitle">
                            {t('welcome_back') || 'Hola'}, <span className="font-bold">{user.full_name || user.username}</span>. {t('dashboard_subtitle') || 'Aquí tienes un resumen de la actividad de hoy.'}
                        </p>
                    </div>
                </header>

                <div className="dashboard__grid">
                    {/* Sidebar Stats */}
                    <aside className="dashboard__sidebar">
                        <DashboardSidebar
                            stats={stats}
                            newPatientStats={newPatientStats}
                            reminders={reminders}
                            user={user}
                            t={t}
                        />
                    </aside>

                    {/* Main Content Area */}
                    <div className="dashboard__content">
                        {(user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                            <nav className="dashboard__nav">
                                <div className="dashboard__nav-item">
                                    <Button
                                        variant="ghost"
                                        active={activeTab === 'requirements'}
                                        onClick={() => setActiveTab('requirements')}
                                    >
                                        📋 {t('ongoing_requirements')}
                                    </Button>
                                    {pendingReqCount > 0 && (
                                        <span className="dashboard__nav-badge">{pendingReqCount}</span>
                                    )}
                                </div>
                            </nav>
                        )}

                        <section className="dashboard__tab-content animate-fadeIn">
                            {activeTab === 'requirements' && (user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                                <div className="requirements-section">
                                    <div className="dashboard__section-header">
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            onClick={() => navigate('/requests')}
                                        >
                                            {t('view_all')} →
                                        </Button>
                                    </div>
                                    <RequirementsList user={user} />
                                </div>
                            )}
                        </section>
                    </div>
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
            </main>
        </div>
    );
};

export default Dashboard;

