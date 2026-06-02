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
import UpcomingAppointmentsView from './components/views/UpcomingAppointmentsView';
import { AppointmentsModals } from './components/sections/AppointmentsModals';
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
                            { id: 'calendar', label: t('combined_view') || 'Calendario y Agenda', icon: 'view_quilt' },
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
                        <div className={`appointments-page-orchestrator__main-grid ${(activeTab === 'monthly' || activeTab === 'agenda') ? 'appointments-page-orchestrator__main-grid--monthly' : ''}`}>
                            {activeTab !== 'agenda' && (
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
                            )}

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
