import React from 'react';
import { useAppointmentsPageController } from './hooks/useAppointmentsPageController';
import MainLayout from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';

// Feature Components
import CalendarSection from './components/calendar/CalendarSection';
import ScheduleSection from './components/schedule/ScheduleSection';
import RescheduleBanner from './components/ui/RescheduleBanner';
import PatientHistoryView from './components/views/PatientHistoryView';
import { AppointmentsModals } from './components/sections/AppointmentsModals';
import SlotExplorerDropdown from './components/ui/SlotExplorerDropdown';

import styles from './AppointmentsPage.module.css';

/**
 * AppointmentsPage (ECC-Pattern Orchestrator).
 * Main page for managing the clinic's agenda and appointments.
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
        isStaff, isAdmin, isSecretary, isPatient, isMedicalStaff, fetched
    } = controller;

    const {
        setShowOutOfHours, setViewDoctorId, setSelectedDate,
        setSearchPatientId, setSearchTerm, setPaymentModal, setActionModal, setHistoryModal,
        setPrescribeModal, setEditPatientModalOpen, setAuthModalOpen
    } = handlers;

    if (!user) return <Loading variant="full-page" />;
    if (loading && !fetched) return <Loading variant="full-page" text={t('loading')} />;

    return (
        <MainLayout 
            wide flush 
            title={t('appointments_title')} 
            hideClock={true}
            doctorSelectorActions={
                <div style={{ position: 'relative' }}>
                    <Button 
                        variant="accent" 
                        size="sm" 
                        onClick={() => {
                            if (showNextSlotModal) setShowNextSlotModal(false);
                            else handlers.openNextSlot();
                        }}
                        icon={<Icon name={showNextSlotModal ? "close" : "bolt"} size="1rem" />}
                        active={showNextSlotModal}
                    >
                        {showNextSlotModal ? t('close') : (t('find_next_free') || 'Próximo Libre')}
                    </Button>
                    
                    {/* ECC: Integrated Slot Explorer (No Modal) */}
                    <SlotExplorerDropdown 
                        isOpen={showNextSlotModal}
                        onClose={() => setShowNextSlotModal(false)}
                        loading={nextSlot.loading}
                        nextSlotData={nextSlot.nextSlotData}
                        includeOutOfHours={nextSlot.includeOutOfHours}
                        onToggleOutOfHours={nextSlot.setIncludeOutOfHours}
                        slotsPage={nextSlot.slotsPage}
                        setSlotsPage={nextSlot.setSlotsPage}
                        slotPages={nextSlot.slotPages}
                        onSelect={(iso, extra) => {
                            handlers.confirmNextSlot(iso, extra);
                            setShowNextSlotModal(false);
                        }}
                        onWhatsApp={nextSlot.handleWhatsApp}
                        jumpToMonth={nextSlot.jumpToMonth}
                        fetchNextFreeSlots={nextSlot.fetchNextFreeSlots}
                        hasNextGroup={nextSlot.hasNextGroup}
                    />
                </div>
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
                showNextSlotModal={false}
                setShowNextSlotModal={setShowNextSlotModal}
                editPatientModalOpen={editPatientModalOpen} setEditPatientModalOpen={setEditPatientModalOpen}
                authModalOpen={authModalOpen} setAuthModalOpen={setAuthModalOpen}
                handlers={handlers} loading={loading} t={t}
            />
        </MainLayout>
    );
};

export default AppointmentsPage;
