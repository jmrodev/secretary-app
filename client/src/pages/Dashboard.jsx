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

    const baseClass = 'dashboard';

    return (
        <MainLayout>
            <div className={baseClass}>
                <header className={`${baseClass}__header`}>
                    <div className={`${baseClass}__header-info`}>
                        <div className={`${baseClass}__title-group`}>
                            <h1 className={`${baseClass}__title`}>{t('dashboard') || 'Panel de Control'}</h1>
                            <div className={`${baseClass}__live-indicator`}>
                                <span className={`${baseClass}__dot`}></span>
                                <span className={`${baseClass}__live-text`}>LIVE</span>
                            </div>
                        </div>
                        <p className={`${baseClass}__subtitle`}>
                            {t('welcome_back') || 'Hola'}, <strong>{user.full_name || user.username}</strong>. {t('dashboard_subtitle') || 'Aquí tienes un resumen de la actividad de hoy.'}
                        </p>
                    </div>
                    <div className={`${baseClass}__header-actions`}>
                        <Button
                            variant="secondary"
                            outline
                            size="sm"
                            onClick={refreshDashboard}
                            icon={<Icon name="sync" size="1.1rem" />}
                            tooltip={t('refresh') || 'Sincronizar Panel'}
                        />
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate('/patients', { state: { openNewPatient: true } })}
                                icon={<Icon name="person_add" size="1.1rem" />}
                            >
                                {t('new_patient') || 'Nuevo Paciente'}
                            </Button>
                        )}
                    </div>
                </header>

                <div className={`${baseClass}__grid`}>
                    {/* Main Content Area - Primary focus */}
                    <section className={`${baseClass}__content`}>
                        {(user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                            <nav className={`${baseClass}__nav`}>
                                <div className={`${baseClass}__nav-item`}>
                                    <Button
                                        variant="ghost"
                                        active={activeTab === 'requirements'}
                                        onClick={() => setActiveTab('requirements')}
                                        icon={<Icon name="assignment" />}
                                    >
                                        {t('ongoing_requirements')}
                                    </Button>
                                    {pendingReqCount > 0 && (
                                        <span className={`${baseClass}__nav-badge`}>{pendingReqCount}</span>
                                    )}
                                </div>
                            </nav>
                        )}

                        <div className={`${baseClass}__tab-content animate-fadeIn`}>
                            {activeTab === 'requirements' && (user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                                <div className={`${baseClass}__requirements`}>
                                    <div className={`${baseClass}__section-header`}>
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            onClick={() => navigate('/requests')}
                                        >
                                            {t('view_all')}
                                            <Icon name="arrow_forward" size="1rem" />
                                        </Button>
                                    </div>
                                    <RequirementsList user={user} />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Sidebar Stats - Secondary info */}
                    <aside className={`${baseClass}__sidebar`}>
                        <DashboardSidebar
                            stats={stats}
                            newPatientStats={newPatientStats}
                            reminders={reminders}
                            user={user}
                            t={t}
                        />
                    </aside>
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

