import React from 'react';
import { useAppointmentsPageController } from './hooks/useAppointmentsPageController';
import MainLayout from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';

// Feature Components (Executors)
import CalendarSection from './components/calendar/CalendarSection';
import ScheduleSection from './components/schedule/ScheduleSection';
import RescheduleBanner from './components/ui/RescheduleBanner';
import PatientHistoryView from './components/views/PatientHistoryView';
import { AppointmentsModals } from './components/sections/AppointmentsModals';
import Button from '@/components/atoms/Button';

import styles from './AppointmentsPage.module.css';

/**
 * AppointmentsPage (Orchestrator).
 * Main page for managing the clinic's agenda and appointments.
 * Orchestrates multiple specialized components (Executors).
 */
const AppointmentsPage = () => {
    const controller = useAppointmentsPageController();
    const {
        t, user, loading, agendaLoading, showOutOfHours,
        viewDoctorId, doctors, institutions, insurances, selectedDate, filteredAppointments,
        appointments, doctorSchedule, holidays, calendarStats, currentDoctor,
        searchTerm, searchPatientId, patientAppointments, searchLoading,
        paymentModal, actionModal, historyModal,
        prescribeModal, whatsappModal, setWhatsappModal, showNextSlotModal, setShowNextSlotModal,
        editPatientModalOpen, authModalOpen,
        handlers, booking, nextSlot, rescheduleAppt, exitRescheduleMode,
        fetched
    } = controller;

    const {
        setShowOutOfHours,
        setSearchPatientId, setPaymentModal, setActionModal, setHistoryModal,
        setPrescribeModal, setEditPatientModalOpen, setAuthModalOpen
    } = handlers;

    // activeTab and upcoming view have been removed as per user request
    // IMPORTANT: Conditional returns MUST happen after ALL hooks/logic that might trigger state
    if (!user) return <Loading variant="full-page" />;

    // Only show global loading if we haven't fetched anything yet (initial load)
    if (loading && !fetched) {
        return <Loading variant="full-page" text={t('loading')} />;
    }

    return (
        <MainLayout 
            wide flush 
            title={t('appointments_title')} 
            hideClock={true}
            doctorSelectorActions={
                <Button 
                    variant="accent" 
                    size="sm" 
                    onClick={handlers.openNextSlot}
                    icon={<Icon name="bolt" size="1rem" />}
                >
                    {t('find_next_free') || 'Próximo Libre'}
                </Button>
            }
        >
            <div className={`${styles.root} layout-content-area animate-fade-in`}>
                <RescheduleBanner rescheduleAppt={rescheduleAppt} onExit={exitRescheduleMode} t={t} />

                <main className={`${styles.main}`}>
                    {searchPatientId || searchTerm ? (
                        <section className={`${styles.panelSearch} animate-fade-in`}>
                            <PatientHistoryView
                                patientAppointments={searchPatientId ? patientAppointments : appointments} 
                                loading={searchLoading}
                                onClose={() => { setSearchPatientId(''); handlers.setSearchTerm(''); }} 
                                t={t} 
                                searchPatientId={searchPatientId || searchTerm} 
                                handlers={handlers}
                            />
                        </section>
                    ) : (
                        <div className={`${styles.mainGrid}`}>
                            <section className={`${styles.panelCalendar}`}>
                                <CalendarSection
                                    selectedDate={selectedDate} onDateSelect={handlers.handleDateSelect}
                                    appointments={filteredAppointments} calendarStats={calendarStats} holidays={holidays}
                                    showOutOfHours={showOutOfHours}
                                    viewDoctorId={viewDoctorId} onSearchPatientId={setSearchPatientId} searchPatientId={searchPatientId}
                                    onCreatePatient={booking.createPatient} onNextFreeSlot={handlers.openNextSlot}
                                    onSyncDayToGoogle={() => handlers.syncDayToGoogle(viewDoctorId, selectedDate)}
                                    loading={agendaLoading}
                                />
                            </section>

                            <section className={`${styles.panelAgenda}`}>
                                <ScheduleSection
                                    selectedDate={selectedDate} onDateSelect={handlers.handleDateSelect}
                                    selectedDoctor={currentDoctor} viewDoctorId={viewDoctorId} appointments={appointments}
                                    doctorSchedule={doctorSchedule} holidays={holidays} onSlotClick={handlers.handleSlotClick}
                                    showOutOfHours={showOutOfHours} setShowOutOfHours={setShowOutOfHours}
                                    onNextFreeSlot={handlers.openNextSlot}
                                    loading={agendaLoading}
                                />
                            </section>
                        </div>
                    )}
                </main>
            </div>

            {/* --- Modals --- */}
            <AppointmentsModals
                doctors={doctors} insurances={insurances} institutions={institutions} booking={booking} nextSlot={nextSlot}
                paymentModal={paymentModal} setPaymentModal={setPaymentModal}
                actionModal={actionModal} setActionModal={setActionModal}
                historyModal={historyModal} setHistoryModal={setHistoryModal}
                prescribeModal={prescribeModal} setPrescribeModal={setPrescribeModal}
                whatsappModal={whatsappModal} setWhatsappModal={setWhatsappModal}
                showNextSlotModal={showNextSlotModal} setShowNextSlotModal={setShowNextSlotModal}
                editPatientModalOpen={editPatientModalOpen} setEditPatientModalOpen={setEditPatientModalOpen}
                authModalOpen={authModalOpen} setAuthModalOpen={setAuthModalOpen}
                handlers={handlers} loading={loading} t={t}
            />
        </MainLayout>
    );
};

export default AppointmentsPage;
