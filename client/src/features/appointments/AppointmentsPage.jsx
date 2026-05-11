import React from 'react';
import { useAppointmentsPageController } from '@/features/appointments/hooks/useAppointmentsPageController';
import MainLayout from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import { PatientManagerModal, PatientHistoryModal } from '@/features/patients';
import { PrescriptionModal } from '@/features/medical_documents';
import WhatsAppModal from '@/features/chat/components/ui/WhatsAppModal';
import AdminAuthModal from '@/features/auth/components/modals/AdminAuthModal';
import Icon from '@/components/atoms/Icon';
import { TransactionModal } from '@/features/finances';

// Feature Components (Executors)
import CalendarSection from '@/features/appointments/components/calendar/CalendarSection';
import ScheduleSection from '@/features/appointments/components/schedule/ScheduleSection';
import RescheduleBanner from '@/features/appointments/components/ui/RescheduleBanner';
import AppointmentActionModal from '@/features/appointments/components/modals/AppointmentActionModal';
import AppointmentFormModal from '@/features/appointments/components/modals/AppointmentFormModal';
import PatientHistoryView from '@/features/appointments/components/views/PatientHistoryView';
import UpcomingAppointmentsView from '@/features/appointments/components/views/UpcomingAppointmentsView';
import NextSlotModal from '@/features/appointments/components/modals/NextSlotModal';
import Button from '@/components/atoms/Button';
import './AppointmentsPage.css';

/**
 * AppointmentsPage (Orchestrator).
 * Main page for managing the clinic's agenda and appointments.
 * Orchestrates multiple specialized components (Executors).
 */
const AppointmentsPage = () => {
    const controller = useAppointmentsPageController();
    const {
        t, user, loading, agendaLoading, activeTab, showOutOfHours,
        viewDoctorId, doctors, institutions, insurances, selectedDate, filteredAppointments,
        appointments, doctorSchedule, holidays, calendarStats, currentDoctor,
        searchTerm, searchPatientId, patientAppointments, searchLoading,
        paymentModal, actionModal, historyModal,
        prescribeModal, whatsappModal, setWhatsappModal, showNextSlotModal, setShowNextSlotModal,
        editPatientModalOpen, authModalOpen,
        handlers, booking, nextSlot, rescheduleAppt, exitRescheduleMode,
        isStaff, isAdmin, isDoctor, isPatient, isMedicalStaff, fetched
    } = controller;

    const {
        setActiveTab, setShowOutOfHours, setViewDoctorId, setSelectedDate,
        setSearchPatientId, setSearchTerm, setPaymentModal, setActionModal, setHistoryModal,
        setPrescribeModal, setEditPatientModalOpen, setAuthModalOpen
    } = handlers;

    // IMPORTANT: Conditional returns MUST happen after ALL hooks/logic that might trigger state
    if (!user) return <Loading variant="full-page" />;

    // Only show global loading if we haven't fetched anything yet (initial load)
    if (loading && !fetched) {
        return <Loading variant="full-page" text={t('loading')} />;
    }

    return (
        <MainLayout wide flush title={t('appointments_title')}>
            <main className="appointments-page-orchestrator">
                <section className="appointments-page-orchestrator__body animate-fade-in">
                    <header className="appointments-page-orchestrator__top-actions">
                        <div className="appointments-page-orchestrator__live-indicator">
                            <span className="appointments-page-orchestrator__live-dot"></span>
                            <span className="appointments-page-orchestrator__live-text">{t('live_mode') || 'LIVE'}</span>
                        </div>

                        <div className="appointments-page-orchestrator__main-actions">
                            <Button 
                                variant="accent" 
                                size="md" 
                                onClick={handlers.openNextSlot}
                                icon={<Icon name="bolt" />}
                                className="appointments-page-orchestrator__next-slot-btn"
                            >
                                <strong>{t('find_next_free') || 'Encontrar Próximo Libre'}</strong>
                            </Button>
                        </div>
                    </header>

                    <RescheduleBanner rescheduleAppt={rescheduleAppt} onExit={exitRescheduleMode} t={t} />

                    <div className="appointments-page-orchestrator__content">
                        {searchPatientId || searchTerm ? (
                            <section className="appointments-page-orchestrator__panel appointments-page-orchestrator__panel--agenda animate-fade-in">
                                <PatientHistoryView
                                    patientAppointments={searchPatientId ? patientAppointments : appointments} 
                                    loading={searchLoading}
                                    onClose={() => { setSearchPatientId(''); handlers.setSearchTerm(''); }} 
                                    t={t} 
                                    searchPatientId={searchPatientId || searchTerm} 
                                    handlers={handlers}
                                />
                            </section>
                        ) : activeTab === 'upcoming' ? (
                            <section className="appointments-page-orchestrator__panel appointments-page-orchestrator__panel--agenda">
                                <UpcomingAppointmentsView
                                    appointments={filteredAppointments} 
                                    loading={loading} 
                                    t={t}
                                    onAction={(a) => setActionModal({ open: true, appt: a })}
                                    onWhatsApp={handlers.handleWhatsAppUniversal}
                                />
                            </section>
                        ) : (
                            <div className={activeTab === 'monthly' ? 'appointments-page-orchestrator__grid appointments-page-orchestrator__grid--monthly' : 'appointments-page-orchestrator__grid'}>
                                <aside className="appointments-page-orchestrator__sidebar">
                                    <section className="appointments-page-orchestrator__panel appointments-page-orchestrator__panel--calendar">
                                        <CalendarSection
                                            activeTab={activeTab} selectedDate={selectedDate} onDateSelect={handlers.handleDateSelect}
                                            appointments={filteredAppointments} calendarStats={calendarStats} holidays={holidays}
                                            onAddHoliday={handlers.handleAddHoliday} showOutOfHours={showOutOfHours}
                                            viewDoctorId={viewDoctorId} onSearchPatientId={setSearchPatientId} searchPatientId={searchPatientId}
                                            onCreatePatient={booking.createPatient} onNextFreeSlot={handlers.openNextSlot}
                                            onSyncDayToGoogle={() => handlers.syncDayToGoogle(viewDoctorId, selectedDate)}
                                            loading={agendaLoading}
                                        />
                                    </section>
                                </aside>

                                {activeTab !== 'monthly' && (
                                    <section className="appointments-page-orchestrator__panel appointments-page-orchestrator__panel--agenda">
                                        <ScheduleSection
                                            activeTab={activeTab} selectedDate={selectedDate} onDateSelect={handlers.handleDateSelect}
                                            selectedDoctor={currentDoctor} viewDoctorId={viewDoctorId} appointments={appointments}
                                            doctorSchedule={doctorSchedule} holidays={holidays} onSlotClick={handlers.handleSlotClick}
                                            onDeleteHoliday={handlers.handleDeleteHoliday} showOutOfHours={showOutOfHours} setShowOutOfHours={setShowOutOfHours}
                                            onNextFreeSlot={handlers.openNextSlot}
                                            loading={agendaLoading}
                                        />
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </main>

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

            <NextSlotModal
                isOpen={showNextSlotModal} onClose={() => setShowNextSlotModal(false)}
                loading={nextSlot.loading} nextSlotData={nextSlot.nextSlotData}
                includeOutOfHours={nextSlot.includeOutOfHours}
                onToggleOutOfHours={(val) => { nextSlot.setIncludeOutOfHours(val); handlers.handleNextFreeSlot(null, val); }}
                slotsPage={nextSlot.slotsPage} setSlotsPage={nextSlot.setSlotsPage} slotPages={nextSlot.slotPages}
                onSelect={handlers.confirmNextSlot} onWhatsApp={handlers.handleWhatsAppSlot}
                onNextGroup={nextSlot.handleNextPage} onPrevGroup={nextSlot.handlePrevPage}
                hasPrevGroup={nextSlot.slotHistory?.length > 0} hasNextGroup={!!nextSlot.nextSlotData?.nextStartDate}
            />

            {editPatientModalOpen && (
                <PatientManagerModal
                    isOpen={editPatientModalOpen} onClose={() => setEditPatientModalOpen(false)}
                    patient={booking.selectedPatientData} referenceInfo={booking.syncReferenceInfo}
                    onUpdate={(updatedData) => { booking.setSelectedPatient(updatedData.id); booking.setSelectedPatientData(updatedData); }}
                    doctors={doctors}
                    insurances={insurances}
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
