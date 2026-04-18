import React from 'react';
import { useAppointmentsPageController } from '@/features/appointments/hooks/useAppointmentsPageController';
import MainLayout from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import NavTabs from '@/components/molecules/NavTabs';
import { DoctorFilter } from '@/features/doctors';
import { PatientManagerModal, PatientHistoryModal } from '@/features/patients';
import { PrescriptionModal } from '@/features/medical_documents';
import WhatsAppModal from '@/features/chat/components/WhatsAppModal';
import AdminAuthModal from '@/features/auth/components/AdminAuthModal';
import { TransactionModal } from '@/features/finances';

// Feature Components (Executors)
import CalendarSection from '@/features/appointments/components/CalendarSection';
import ScheduleSection from '@/features/appointments/components/ScheduleSection';
import RescheduleBanner from '@/features/appointments/components/RescheduleBanner';
import AppointmentActionModal from '@/features/appointments/components/AppointmentActionModal';
import AppointmentFormModal from '@/features/appointments/components/AppointmentFormModal';
import PatientHistoryView from '@/features/appointments/components/PatientHistoryView';
import UpcomingAppointmentsView from '@/features/appointments/components/UpcomingAppointmentsView';
import NextSlotCalendarModal from '@/features/appointments/components/NextSlotCalendarModal';

import './AppointmentsPage.css';

/**
 * AppointmentsPage (Orchestrator).
 * Main page for managing the clinic's agenda and appointments.
 * Orchestrates multiple specialized components (Executors).
 */
const AppointmentsPage = () => {
    const controller = useAppointmentsPageController();
    const {
        t, user, loading, activeTab, showOutOfHours,
        viewDoctorId, doctors, institutions, selectedDate, filteredAppointments,
        appointments, doctorSchedule, holidays, calendarStats, currentDoctor,
        searchPatientId, patientAppointments, patientApptLoading,
        paymentModal, actionModal, historyModal,
        prescribeModal, whatsappModal, setWhatsappModal, showNextSlotModal, setShowNextSlotModal,
        editPatientModalOpen, authModalOpen,
        handlers, booking, nextSlot, rescheduleAppt, exitRescheduleMode,
        isStaff, isAdmin, isDoctor, isPatient, isMedicalStaff
    } = controller;
    const {
        setActiveTab, setShowOutOfHours, setViewDoctorId, setSelectedDate,
        setSearchPatientId, setPaymentModal, setActionModal, setHistoryModal,
        setPrescribeModal, setEditPatientModalOpen, setAuthModalOpen
    } = handlers;

    if (loading || !user) return <Loading variant="full-page" />;

    return (
        <MainLayout wide>
            <RescheduleBanner rescheduleAppt={rescheduleAppt} onExit={exitRescheduleMode} t={t} />

            <header className="dashboard-header animate-fadeIn">
                <h1 className="dashboard-header__title">{t('appointments_title') || 'Agenda de Turnos'}</h1>
                <p className="dashboard-header__subtitle">{t('appointments_subtitle') || 'Gestiona tu agenda diaria.'}</p>
            </header>

            <div className="appointments-tab-content animate-fadeIn">
                {searchPatientId ? (
                    <PatientHistoryView
                        patientAppointments={patientAppointments} loading={patientApptLoading}
                        onClose={() => setSearchPatientId('')} t={t} searchPatientId={searchPatientId} handlers={handlers}
                    />
                ) : activeTab === 'upcoming' ? (
                    <UpcomingAppointmentsView
                        appointments={filteredAppointments} loading={loading} t={t}
                        onAction={(a) => setActionModal({ open: true, appt: a })}
                        onWhatsApp={handlers.handleWhatsAppUniversal}
                    />
                ) : (
                    <div className={activeTab === 'monthly' ? "appointments-grid--monthly" : "dashboard-grid"}>
                        <aside className="dashboard-sidebar">
                            <div className="dashboard-nav-bar animate-fadeIn">
                                <NavTabs activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} isStaff={isStaff} isAdmin={isAdmin} />
                                <DoctorFilter
                                    activeTab={activeTab} userRole={user?.role} isStaff={isStaff} isAdmin={isAdmin} viewDoctorId={viewDoctorId}
                                    setViewDoctorId={setViewDoctorId} doctors={doctors}
                                />
                            </div>
                            <CalendarSection
                                activeTab={activeTab} selectedDate={selectedDate} onDateSelect={handlers.handleDateSelect}
                                appointments={filteredAppointments} calendarStats={calendarStats} holidays={holidays}
                                onAddHoliday={handlers.handleAddHoliday} showOutOfHours={showOutOfHours}
                                viewDoctorId={viewDoctorId} onSearchPatientId={setSearchPatientId} searchPatientId={searchPatientId}
                                onCreatePatient={booking.createPatient} onNextFreeSlot={handlers.openNextSlot}
                                onSyncDayToGoogle={() => handlers.syncDayToGoogle(viewDoctorId, selectedDate)}
                            />
                        </aside>

                        {activeTab !== 'monthly' && (
                            <ScheduleSection
                                activeTab={activeTab} selectedDate={selectedDate} onDateSelect={handlers.handleDateSelect}
                                selectedDoctor={currentDoctor} viewDoctorId={viewDoctorId} appointments={appointments}
                                doctorSchedule={doctorSchedule} holidays={holidays} onSlotClick={handlers.handleSlotClick}
                                onDeleteHoliday={handlers.handleDeleteHoliday} showOutOfHours={showOutOfHours} setShowOutOfHours={setShowOutOfHours}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* --- Modals --- */}
            <AppointmentActionModal
                isOpen={actionModal.open} onClose={() => setActionModal({ ...actionModal, open: false })}
                appt={actionModal.appt} doctors={doctors} onHistory={handlers.handleOpenHistory}
                onPrescribe={handlers.handleOpenPrescribe} onUpdateStatus={handlers.handleUpdateStatus}
                onReschedule={handlers.handleOpenReschedule} onCancel={handlers.handleCancel} onDelete={handlers.handleDelete}
                onSync={handlers.handleOpenSync} onPay={handlers.handleOpenPayment} onWhatsApp={handlers.handleWhatsAppUniversal}
                onUpdateType={handlers.handleUpdateType} onHardEdit={handlers.handleHardEdit} onBonify={handlers.handleBonify}
                onSaveNote={handlers.handleSaveNote} fetchAppointments={handlers.fetchAppointments}
            />

            <PrescriptionModal
                isOpen={prescribeModal.open} onClose={() => setPrescribeModal({ ...prescribeModal, open: false })}
                patientName={prescribeModal.patientName} patientId={prescribeModal.patientId}
                onSubmit={(data) => handlers.handleSavePrescription({ ...prescribeModal, ...data })} t={t} isSubmitting={loading}
            />

            <PatientHistoryModal
                isOpen={historyModal.open} onClose={() => setHistoryModal({ ...historyModal, open: false })}
                patientId={historyModal.patientId} patientName={historyModal.patientName}
            />

            <WhatsAppModal
                isOpen={whatsappModal.open} onClose={() => setWhatsappModal({ ...whatsappModal, open: false })}
                phone={whatsappModal.phone} message={whatsappModal.message}
                onMessageChange={(msg) => setWhatsappModal({ ...whatsappModal, message: msg })}
            />

            <NextSlotCalendarModal
                isOpen={showNextSlotModal} onClose={() => setShowNextSlotModal(false)}
                loading={nextSlot.loading} nextSlotData={nextSlot.nextSlotData}
                includeOutOfHours={nextSlot.includeOutOfHours}
                onToggleOutOfHours={(val) => { nextSlot.setIncludeOutOfHours(val); handlers.handleNextFreeSlot(null, val); }}
                onSelect={handlers.confirmNextSlot} onWhatsApp={handlers.handleWhatsAppSlot}
                onLoadMore={nextSlot.loadMoreSlots} hasMore={!!nextSlot.nextSlotData?.nextStartDate}
            />

            {editPatientModalOpen && (
                <PatientManagerModal
                    isOpen={editPatientModalOpen} onClose={() => setEditPatientModalOpen(false)}
                    patient={booking.selectedPatientData} referenceInfo={booking.syncReferenceInfo}
                    onUpdate={(updatedData) => { booking.setSelectedPatient(updatedData.id); booking.setSelectedPatientData(updatedData); }}
                    doctors={doctors}
                />
            )}

            {booking.showForm && (
                <AppointmentFormModal
                    isOpen={booking.showForm} onClose={() => booking.setShowForm(false)}
                    {...booking} onSubmit={handlers.handleBook} doctors={doctors} institutions={institutions}
                    onOpenEditPatient={() => setEditPatientModalOpen(true)} t={t} handlers={booking.handlers}
                />
            )}

            <AdminAuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onConfirm={handlers.handleAdminAuthConfirm} />
            <TransactionModal isOpen={paymentModal.open} onClose={() => setPaymentModal({ ...paymentModal, open: false })} initialData={paymentModal.initialData} onSuccess={() => handlers.fetchAppointments()} />
        </MainLayout>
    );
};

export default AppointmentsPage;
