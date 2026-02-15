
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointmentsPageController } from '../controllers/useAppointmentsPageController';
import Button from '../components/atoms/Button';

// Components
import CalendarSection from '../components/organisms/CalendarSection';
import ScheduleSection from '../components/organisms/ScheduleSection';
import MainLayout from '../components/templates/MainLayout';
import NavTabs from '../components/molecules/NavTabs';
import DoctorFilter from '../components/molecules/DoctorFilter';
import RescheduleBanner from '../components/molecules/RescheduleBanner';

// Modals
import AppointmentActionModal from '../components/organisms/AppointmentActionModal';
import AppointmentFormModal from '../components/organisms/AppointmentFormModal';
import Modal from '../components/molecules/Modal';
import PatientHistoryModal from '../components/molecules/PatientHistoryModal';
import PatientManagerModal from '../components/molecules/PatientManagerModal';
import PrescriptionModal from '../components/organisms/PrescriptionModal';
import NextSlotCalendarModal from '../components/molecules/NextSlotCalendarModal';
import WhatsAppModal from '../components/molecules/WhatsAppModal';
import AdminAuthModal from '../components/molecules/AdminAuthModal';
import PatientHistoryView from '../components/organisms/PatientHistoryView';
import UpcomingAppointmentsView from '../components/organisms/UpcomingAppointmentsView';
import TransactionModal from '../components/molecules/TransactionModal';

import './Appointments.css';

import Loading from '../components/atoms/Loading';

const Appointments = () => {
    const navigate = useNavigate();
    const controller = useAppointmentsPageController();
    const {
        t, user,
        loading,
        activeTab, setActiveTab,
        showOutOfHours, setShowOutOfHours,
        viewDoctorId, setViewDoctorId,
        doctors,
        selectedDate,
        filteredAppointments,
        appointments,
        doctorSchedule,
        holidays,
        calendarStats,
        currentDoctor,
        searchPatientId, setSearchPatientId,
        patientAppointments, patientApptLoading,

        // Modals State
        paymentModal, setPaymentModal,
        actionModal, setActionModal,
        historyModal, setHistoryModal,
        prescribeModal, setPrescribeModal,
        whatsappModal, setWhatsappModal,
        showNextSlotModal, setShowNextSlotModal,
        editPatientModalOpen, setEditPatientModalOpen,
        authModalOpen, setAuthModalOpen,

        // Handlers Group
        handlers,

        // Sub-hooks exposed for specific components if needed directly
        booking,
        nextSlot,

        // Misc
        rescheduleAppt,
        exitRescheduleMode,
    } = controller;

    if (loading) return <Loading variant="full-page" />;

    return (
        <MainLayout wide>
            <RescheduleBanner
                rescheduleAppt={rescheduleAppt}
                onExit={exitRescheduleMode}
                t={t}
            />

            <header className="dashboard-header animate-fadeIn">
                <h1 className="dashboard-header__title">{t('appointments_title') || 'Agenda de Turnos'}</h1>
                <p className="dashboard-header__subtitle">{t('appointments_subtitle') || 'Gestiona tu agenda diaria y visualiza los próximos compromisos.'}</p>
            </header>

            <div className="appointments-tab-content animate-fadeIn">
                {searchPatientId ? (
                    <PatientHistoryView
                        patientAppointments={patientAppointments}
                        loading={patientApptLoading}
                        onClose={() => setSearchPatientId('')}
                        t={t}
                        searchPatientId={searchPatientId}
                        handlers={handlers}
                    />
                ) : activeTab === 'upcoming' ? (
                    <UpcomingAppointmentsView
                        appointments={filteredAppointments}
                        loading={loading}
                        t={t}
                        onAction={(a) => setActionModal({ open: true, appt: a })}
                        onWhatsApp={handlers.handleWhatsAppUniversal}
                    />
                ) : (
                    <div className={activeTab === 'monthly' ? "appointments-grid--monthly" : "dashboard-grid"}>
                        <aside className="dashboard-sidebar">
                            <div className="dashboard-nav-bar animate-fadeIn">
                                <NavTabs
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    userRole={user.role}
                                />

                                <DoctorFilter
                                    activeTab={activeTab}
                                    userRole={user.role}
                                    viewDoctorId={viewDoctorId}
                                    setViewDoctorId={setViewDoctorId}
                                    doctors={doctors}
                                />
                            </div>

                            <CalendarSection
                                activeTab={activeTab}
                                selectedDate={selectedDate}
                                onDateSelect={handlers.handleDateSelect}
                                appointments={filteredAppointments}
                                calendarStats={calendarStats}
                                holidays={holidays}
                                onAddHoliday={handlers.handleAddHoliday}
                                showOutOfHours={showOutOfHours}
                                setShowOutOfHours={setShowOutOfHours}
                                viewDoctorId={viewDoctorId}
                                onSearchPatientId={setSearchPatientId}
                                searchPatientId={searchPatientId}
                                onCreatePatient={booking.createPatient}
                                onNextFreeSlot={handlers.openNextSlot}
                                onSyncDayToGoogle={() => handlers.syncDayToGoogle(viewDoctorId, selectedDate)}
                            />
                        </aside>

                        {activeTab !== 'monthly' && (
                            <ScheduleSection
                                activeTab={activeTab}
                                selectedDate={selectedDate}
                                onDateSelect={handlers.handleDateSelect}
                                selectedDoctor={currentDoctor}
                                viewDoctorId={viewDoctorId}
                                appointments={appointments}
                                doctorSchedule={doctorSchedule}
                                holidays={holidays}
                                onSlotClick={handlers.handleSlotClick}
                                onDeleteHoliday={handlers.handleDeleteHoliday}
                                showOutOfHours={showOutOfHours}
                                setShowOutOfHours={setShowOutOfHours}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* --- Modals --- */}
            <AppointmentActionModal
                isOpen={actionModal.open}
                onClose={() => setActionModal({ ...actionModal, open: false })}
                appt={actionModal.appt}
                doctors={doctors}
                onHistory={handlers.handleOpenHistory}
                onPrescribe={handlers.handleOpenPrescribe}
                onUpdateStatus={handlers.handleUpdateStatus}
                onReschedule={handlers.handleOpenReschedule}
                onCancel={handlers.handleCancel}
                onDelete={handlers.handleDelete}
                onSync={handlers.handleOpenSync}
                onPay={handlers.handleOpenPayment}
                onWhatsApp={handlers.handleWhatsAppUniversal}
                onUpdateType={handlers.handleUpdateType}
                onHardEdit={handlers.handleHardEdit}
                onSaveNote={handlers.handleSaveNote}
                fetchAppointments={handlers.fetchAppointments}
            />

            <PrescriptionModal
                isOpen={prescribeModal.open}
                onClose={() => setPrescribeModal({ ...prescribeModal, open: false })}
                patientName={prescribeModal.patientName}
                onSubmit={(data) => handlers.handleSavePrescription({ ...prescribeModal, ...data })}
                t={t}
                isSubmitting={loading}
            />

            <PatientHistoryModal
                isOpen={historyModal.open}
                onClose={() => setHistoryModal({ ...historyModal, open: false })}
                patientId={historyModal.patientId}
                patientName={historyModal.patientName}
            />

            <WhatsAppModal
                isOpen={whatsappModal.open}
                onClose={() => setWhatsappModal({ ...whatsappModal, open: false })}
                phone={whatsappModal.phone}
                message={whatsappModal.message}
                onMessageChange={(msg) => setWhatsappModal({ ...whatsappModal, message: msg })}
            />

            <NextSlotCalendarModal
                isOpen={showNextSlotModal}
                onClose={() => setShowNextSlotModal(false)}
                loading={nextSlot.loading}
                nextSlotData={nextSlot.nextSlotData}
                includeOutOfHours={nextSlot.includeOutOfHours}
                onToggleOutOfHours={(val) => {
                    nextSlot.setIncludeOutOfHours(val);
                    handlers.handleNextFreeSlot(null, val);
                }}
                onSelect={handlers.confirmNextSlot}
                onWhatsApp={handlers.handleWhatsAppSlot}
                onLoadMore={nextSlot.loadMoreSlots}
                hasMore={!!nextSlot.nextSlotData?.nextStartDate}
            />

            {
                editPatientModalOpen && (
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
                    />
                )
            }

            {
                booking.showForm && (
                    <AppointmentFormModal
                        isOpen={booking.showForm}
                        onClose={() => booking.setShowForm(false)}
                        {...booking}
                        onSubmit={handlers.handleBook}
                        doctors={doctors}
                        institutions={controller.institutions}
                        onOpenEditPatient={() => setEditPatientModalOpen(true)}
                        t={t}
                        handlers={booking.handlers}
                    />
                )
            }

            <AdminAuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                onConfirm={handlers.handleAdminAuthConfirm}
            />

            <TransactionModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                initialData={paymentModal.initialData}
                onSuccess={async () => {
                    handlers.fetchAppointments();
                }}
            />
        </MainLayout >
    );
};

export default Appointments;
