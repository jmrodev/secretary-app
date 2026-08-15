import React from 'react';
import { useAppointmentsPageController } from './hooks/useAppointmentsPageController';
import { MainLayout } from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';

// Feature Components
import { CalendarSection } from './components/calendar/CalendarSection';
import { ScheduleSection } from './components/schedule/ScheduleSection';
import { RescheduleBanner } from './components/ui/RescheduleBanner';
import { PatientHistoryView } from './components/views/PatientHistoryView';
import { AppointmentsModals } from './components/sections/AppointmentsModals';
import { SlotExplorerDropdown } from './components/ui/SlotExplorerDropdown';

// Shared/Domain Modals (Injectable slots)
import { PrescriptionModal, MedicationInput } from '@/features/medical_documents';
import { PatientHistoryModal, PatientManagerModal, PatientSearchSelect } from '@/features/patients';
import { WhatsAppModal } from '@/features/chat/components/ui/WhatsAppModal';
import { AdminAuthModal } from '@/features/auth/components/modals/AdminAuthModal';
import { TransactionModal } from '@/features/finances';

import styles from './AppointmentsPage.module.css';

/**
 * AppointmentsPage (ECC-Pattern Orchestrator).
 * Main page for managing the clinic's agenda and appointments.
 */
export const AppointmentsPage = () => {
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
        setShowOutOfHours,
        setSearchPatientId, setPaymentModal, setActionModal, setHistoryModal,
        setPrescribeModal, setEditPatientModalOpen, setAuthModalOpen
    } = handlers;

    if (!user) return <Loading variant="full-page" />;
    if (loading && !fetched) return <Loading variant="full-page" text={t('loading')} />;

    return (
        <MainLayout 
            wide flush 
            title={t('appointments_title')} 
            actionSlot={
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
                        {t('find_next_free') || 'Próximo Libre'}
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
            <div className={`${styles.AppointmentsPage__root}  `}>
                <RescheduleBanner rescheduleAppt={rescheduleAppt} onExit={exitRescheduleMode} t={t} />

                <section className={`${styles.AppointmentsPage__main}`}>
                    {searchPatientId || searchTerm ? (
                        <section className={`${styles.AppointmentsPage__panelSearch} `}>
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
                        <div className={`${styles.AppointmentsPage__mainGrid}`}>
                            <section className={`${styles.AppointmentsPage__panelCalendar}`}>
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

                            <section className={`${styles.AppointmentsPage__panelAgenda}`}>
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
                </section>
            </div>

            {/* --- Modals --- */}
            <AppointmentsModals
                doctors={doctors} institutions={institutions} booking={booking} nextSlot={nextSlot}
                paymentModal={paymentModal}
                PatientSearchSelectComponent={PatientSearchSelect}
                actionModal={actionModal} setActionModal={setActionModal}
                historyModal={historyModal} setHistoryModal={setHistoryModal}
                prescribeModal={prescribeModal} setPrescribeModal={setPrescribeModal}
                whatsappModal={whatsappModal} setWhatsappModal={setWhatsappModal}
                showNextSlotModal={false}
                setShowNextSlotModal={setShowNextSlotModal}
                editPatientModalOpen={editPatientModalOpen} setEditPatientModalOpen={setEditPatientModalOpen}
                authModalOpen={authModalOpen}
                handlers={handlers} t={t}
                prescriptionModalSlot={
                    <PrescriptionModal
                        isOpen={prescribeModal.open}
                        onClose={() => setPrescribeModal(prev => ({ ...prev, open: false }))}
                        patientName={prescribeModal.patientName}
                        patientId={prescribeModal.patientId}
                        onSubmit={(data) => handlers.handleSavePrescription({ ...prescribeModal, ...data })}
                        t={t}
                        isSubmitting={loading}
                    />
                }
                patientHistoryModalSlot={
                    <PatientHistoryModal
                        isOpen={historyModal.open}
                        onClose={() => setHistoryModal(prev => ({ ...prev, open: false }))}
                        patientId={historyModal.patientId}
                        patientName={historyModal.patientName}
                    />
                }
                patientManagerModalSlot={
                    <PatientManagerModal
                        isOpen={editPatientModalOpen}
                        onClose={() => setEditPatientModalOpen(false)}
                        patient={booking.selectedPatientData}
                        referenceInfo={booking.syncReferenceInfo}
                        onUpdate={(updatedData) => {
                            booking.setSelectedPatient(updatedData.id);
                            booking.setSelectedPatientData(updatedData);
                        }}
                        doctors={doctors}
                        insurances={insurances}
                    />
                }
                whatsappModalSlot={
                    <WhatsAppModal
                        isOpen={whatsappModal.open}
                        onClose={() => setWhatsappModal(prev => ({ ...prev, open: false }))}
                        phone={whatsappModal.phone}
                        message={whatsappModal.message}
                        onMessageChange={(msg) => setWhatsappModal(prev => ({ ...prev, message: msg }))}
                    />
                }
                adminAuthModalSlot={
                    <AdminAuthModal
                        isOpen={authModalOpen}
                        onClose={() => setAuthModalOpen(false)}
                        onConfirm={handlers.handleAdminAuthConfirm}
                    />
                }
                transactionModalSlot={
                    <TransactionModal
                        isOpen={paymentModal.open}
                        onClose={() => setPaymentModal(prev => ({ ...prev, open: false }))}
                        initialData={paymentModal.initialData}
                        onSuccess={() => handlers.fetchAppointments()}
                        MedicationInputComponent={MedicationInput}
                    />
                }
            />
        </MainLayout>
    );
};

