import React from 'react';
import { useAppointmentsPageController } from './hooks/useAppointmentsPageController';
import MainLayout from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import { PatientManagerModal, PatientHistoryModal } from '@/features/patients';
import { PrescriptionModal } from '@/features/medical_documents';
import WhatsAppModal from '@/features/chat/components/ui/WhatsAppModal';
import AdminAuthModal from '@/features/auth/components/modals/AdminAuthModal';
import Icon from '@/components/atoms/Icon';
import { TransactionModal } from '@/features/finances';

// Feature Components (Executors)
import CalendarSection from './components/calendar/CalendarSection';
import ScheduleSection from './components/schedule/ScheduleSection';
import RescheduleBanner from './components/ui/RescheduleBanner';
import AppointmentActionModal from './components/modals/AppointmentActionModal';
import AppointmentFormModal from './components/modals/AppointmentFormModal';
import PatientHistoryView from './components/views/PatientHistoryView';
import UpcomingAppointmentsView from './components/views/UpcomingAppointmentsView';
import NextSlotModal from './components/modals/NextSlotModal';
import Button from '@/components/atoms/Button';
import './AppointmentsPage.css';

import FeatureToolbar from '@/components/organisms/FeatureToolbar';

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
        <MainLayout wide title={t('appointments_title')}>
            <div className="appointments-page-orchestrator layout-content-area animate-fade-in">
                    <FeatureToolbar
                        className="appointments-page-orchestrator__top-actions"
                        tabs={[
                            { id: 'agenda', label: t('daily_agenda') || 'Agenda Diaria', icon: 'view_day' },
                            { id: 'monthly', label: t('monthly_view') || 'Vista Mensual', icon: 'calendar_month' },
                            { id: 'upcoming', label: t('upcoming') || 'Próximos', icon: 'upcoming' }
                        ]}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        actions={
                            <div className="appointments-page__toolbar-actions">
                                <div className="appointments-page-orchestrator__live-indicator">
                                    <span className="appointments-page-orchestrator__live-dot"></span>
                                    <span className="appointments-page-orchestrator__live-text">{t('live_mode') || 'LIVE'}</span>
                                </div>
                                
                                <Button 
                                    variant="accent" 
                                    size="sm" 
                                    onClick={handlers.openNextSlot}
                                    icon={<Icon name="bolt" size="1rem" />}
                                >
                                    {t('find_next_free') || 'Próximo Libre'}
                                </Button>
                            </div>
                        }
                        // FeatureToolbar handles DoctorSelector automatically
                    />

                <RescheduleBanner rescheduleAppt={rescheduleAppt} onExit={exitRescheduleMode} t={t} />

                <main className="appointments-page-orchestrator__main">
                    {searchPatientId || searchTerm ? (
                        <section className="appointments-page-orchestrator__panel appointments-page-orchestrator__panel--search animate-fade-in">
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
                        <section className="appointments-page-orchestrator__panel appointments-page-orchestrator__panel--upcoming">
                            <UpcomingAppointmentsView
                                appointments={filteredAppointments} 
                                loading={loading} 
                                t={t}
                                onAction={(a) => setActionModal(prev => ({ ...prev, open: true, appt: a }))}
                                onWhatsApp={handlers.handleWhatsAppUniversal}
                            />
                        </section>
                    ) : (
                        <div className={`appointments-page-orchestrator__main-grid ${activeTab === 'monthly' ? 'appointments-page-orchestrator__main-grid--monthly' : ''}`}>
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
                </main>
            </div>

            {/* --- Modals --- */}
            <AppointmentActionModal
                isOpen={actionModal.open} onClose={() => setActionModal(prev => ({ ...prev, open: false }))}
                appt={actionModal.appt} doctors={doctors} onHistory={handlers.handleOpenHistory}
                onPrescribe={handlers.handleOpenPrescribe} onUpdateStatus={handlers.handleUpdateStatus}
                onReschedule={handlers.handleOpenReschedule} onCancel={handlers.handleCancel} onDelete={handlers.handleDelete}
                onSync={handlers.handleOpenSync} onPay={handlers.handleOpenPayment} onWhatsApp={handlers.handleWhatsAppUniversal}
                onUpdateType={handlers.handleUpdateType} onHardEdit={handlers.handleHardEdit} onBonify={handlers.handleBonify}
                onSaveNote={handlers.handleSaveNote} fetchAppointments={handlers.fetchAppointments}
            />

            {prescribeModal.open && (
                <PrescriptionModal
                    isOpen={prescribeModal.open} onClose={() => setPrescribeModal(prev => ({ ...prev, open: false }))}
                    patientName={prescribeModal.patientName} patientId={prescribeModal.patientId}
                    onSubmit={(data) => handlers.handleSavePrescription({ ...prescribeModal, ...data })} t={t} isSubmitting={loading}
                />
            )}

            {historyModal.open && (
                <PatientHistoryModal
                    isOpen={historyModal.open} onClose={() => setHistoryModal(prev => ({ ...prev, open: false }))}
                    patientId={historyModal.patientId} patientName={historyModal.patientName}
                />
            )}

            {whatsappModal.open && (
                <WhatsAppModal
                    isOpen={whatsappModal.open} onClose={() => setWhatsappModal(prev => ({ ...prev, open: false }))}
                    phone={whatsappModal.phone} message={whatsappModal.message}
                    onMessageChange={(msg) => setWhatsappModal(prev => ({ ...prev, message: msg }))}
                />
            )}

            {showNextSlotModal && (
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
            )}

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
            <TransactionModal isOpen={paymentModal.open} onClose={() => setPaymentModal(prev => ({ ...prev, open: false }))} initialData={paymentModal.initialData} onSuccess={() => handlers.fetchAppointments()} />
        </MainLayout>
    );
};

export default AppointmentsPage;
