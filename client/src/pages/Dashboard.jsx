
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
        navigate
    } = controller;

    if (!user) return <div className="status-display"><div className="status-display__spinner"></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <header className="page-header">
                    <div className="page-header__info">
                        <h1 className="page-header__title">{t('dashboard') || 'Panel de Control'}</h1>
                        <p className="page-header__subtitle">
                            {t('welcome_back') || 'Hola'}, <span className="font-bold text-main-800">{user.full_name || user.username}</span>. {t('dashboard_subtitle') || 'Aquí tienes un resumen de la actividad de hoy.'}
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    {/* Sidebar Stats */}
                    <div className="lg:col-span-1">
                        <DashboardSidebar
                            stats={stats}
                            newPatientStats={newPatientStats}
                            reminders={reminders}
                            user={user}
                            t={t}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3 flex flex-col gap-8">
                        {(user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                            <nav className="tab-nav">
                                <Button
                                    variant="ghost"
                                    className={`tab-nav__item ${activeTab === 'requirements' ? 'tab-nav__item--active' : ''}`}
                                    onClick={() => setActiveTab('requirements')}
                                >
                                    📋 {t('ongoing_requirements')}
                                    {pendingReqCount > 0 && (
                                        <span className="dot-badge ml-2 bg-red-500 text-white">{pendingReqCount}</span>
                                    )}
                                </Button>
                            </nav>
                        )}

                        <section className="tab-content animate-fadeIn">
                            {activeTab === 'requirements' && (user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            className="text-blue-600 hover:bg-blue-50"
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
                    onPay={(appt) => {
                        setPaymentModal({
                            open: true,
                            initialData: {
                                type: 'income_patient',
                                amount: appt.cost || 0,
                                patientId: appt.patient_id,
                                patientName: appt.patient_name,
                                patientDni: appt.patient_dni,
                                patientUserId: appt.patient_user_id,
                                doctorId: appt.doctor_id,
                                description: `Payment for appointment on ${new Date(appt.appointment_date).toLocaleDateString()}`,
                                apptId: appt.id
                            },
                            apptId: appt.id
                        });
                        setActionModal({ ...actionModal, open: false });
                    }}
                    onWhatsApp={handleWhatsApp}
                    onHistory={(appt) => {
                        setHistoryModal({
                            open: true,
                            patientId: appt.patient_id,
                            patientName: appt.patient_name
                        });
                        setActionModal({ ...actionModal, open: false });
                    }}
                    onPrescribe={(appt) => {
                        setPrescribeModal({
                            open: true,
                            apptId: appt.id,
                            patientName: appt.patient_name,
                            medications: '',
                            instructions: ''
                        });
                        setActionModal({ ...actionModal, open: false });
                    }}
                    onReschedule={(appt) => navigate('/appointments', { state: { rescheduleAppt: appt } })}
                    onSync={(appt) => navigate('/appointments', { state: { syncAppt: appt } })}
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
