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
    const formattedSelectedDate = selectedDate?.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const doctorDisplayName = currentDoctor?.full_name || currentDoctor?.name;

    if (loading || !user) return <Loading variant="full-page" />;

    return (
        <MainLayout wide>
            <article className="appointments-page animate-fadeIn">
                <RescheduleBanner rescheduleAppt={rescheduleAppt} onExit={exitRescheduleMode} t={t} />

                <header className="appointments-page__header">
                    <div className="appointments-page__heading">
                        <h1 className="appointments-page__title">{t('appointments_title')}</h1>
                        <p className="appointments-page__subtitle">{t('appointments_subtitle')}</p>
                    </div>

                    <section className="appointments-page__context" aria-label={t('today_schedule')}>
                        <p className="appointments-page__context-item">
                            <span className="appointments-page__context-label">{t('date_label')}</span>
                            <strong className="appointments-page__context-value">{formattedSelectedDate}</strong>
                        </p>

                        {doctorDisplayName && (
                            <p className="appointments-page__context-item">
                                <span className="appointments-page__context-label">{t('doctor')}</span>
                                <strong className="appointments-page__context-value">{doctorDisplayName}</strong>
                            </p>
                        )}
                    </section>
                </header>

                <section className="appointments-page__body">
                {searchPatientId ? (
                    <section className="appointments-page__panel appointments-page__panel--agenda">
                        <PatientHistoryView
                            patientAppointments={patientAppointments} loading={patientApptLoading}
                            onClose={() => setSearchPatientId('')} t={t} searchPatientId={searchPatientId} handlers={handlers}
                        />
                    </section>
                ) : activeTab === 'upcoming' ? (
                    <section className="appointments-page__panel appointments-page__panel--agenda">
                        <UpcomingAppointmentsView
                            appointments={filteredAppointments} loading={loading} t={t}
                            onAction={(a) => setActionModal({ open: true, appt: a })}
                            onWhatsApp={handlers.handleWhatsAppUniversal}
                        />
                    </section>
                ) : (
                    <section className={activeTab === 'monthly' ? 'appointments-page__grid appointments-page__grid--monthly' : 'appointments-page__grid'}>
                        <aside className="appointments-page__sidebar">
                            <section className="appointments-page__panel appointments-page__panel--nav">
                                <NavTabs activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} isStaff={isStaff} isAdmin={isAdmin} />
                                <DoctorFilter
                                    activeTab={activeTab} userRole={user?.role} isStaff={isStaff} isAdmin={isAdmin} viewDoctorId={viewDoctorId}
                                    setViewDoctorId={setViewDoctorId} doctors={doctors}
                                />
                            </section>

                            <section className="appointments-page__panel appointments-page__panel--calendar">
                                <CalendarSection
                                    activeTab={activeTab} selectedDate={selectedDate} onDateSelect={handlers.handleDateSelect}
                                    appointments={filteredAppointments} calendarStats={calendarStats} holidays={holidays}
                                    onAddHoliday={handlers.handleAddHoliday} showOutOfHours={showOutOfHours}
                                    viewDoctorId={viewDoctorId} onSearchPatientId={setSearchPatientId} searchPatientId={searchPatientId}
                                    onCreatePatient={booking.createPatient} onNextFreeSlot={handlers.openNextSlot}
                                    onSyncDayToGoogle={() => handlers.syncDayToGoogle(viewDoctorId, selectedDate)}
                                />
                            </section>
                        </aside>

                        {activeTab !== 'monthly' && (
                            <section className="appointments-page__panel appointments-page__panel--agenda">
                                <ScheduleSection
                                    activeTab={activeTab} selectedDate={selectedDate} onDateSelect={handlers.handleDateSelect}
                                    selectedDoctor={currentDoctor} viewDoctorId={viewDoctorId} appointments={appointments}
                                    doctorSchedule={doctorSchedule} holidays={holidays} onSlotClick={handlers.handleSlotClick}
                                    onDeleteHoliday={handlers.handleDeleteHoliday} showOutOfHours={showOutOfHours} setShowOutOfHours={setShowOutOfHours}
                                />
                            </section>
                        )}
                    </section>
                )}
                </section>
            </article>

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
