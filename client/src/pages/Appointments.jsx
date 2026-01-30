
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
import PatientEditModal from '../components/molecules/PatientEditModal';
import MedicationAutocomplete from '../components/molecules/MedicationAutocomplete';
import NextSlotCalendarModal from '../components/molecules/NextSlotCalendarModal';
import WhatsAppModal from '../components/molecules/WhatsAppModal';
import AdminAuthModal from '../components/molecules/AdminAuthModal';
import PatientHistoryView from '../components/organisms/PatientHistoryView';
import UpcomingAppointmentsView from '../components/organisms/UpcomingAppointmentsView';
import TransactionModal from '../components/molecules/TransactionModal';

const Appointments = () => {
    const navigate = useNavigate();
    const controller = useAppointmentsPageController();
    const {
        t, user,
        loading,
        activeTab, setActiveTab,
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

        // Handlers
        handleDateSelect,
        handleSlotClick,
        handleAddHoliday, handleDeleteHoliday,
        booking,
        nextSlot,
        handleUpdateStatus,
        handleCancel,
        handleDelete,
        handleSyncGoogleEvent,
        handleSavePrescription,
        handleWhatsAppUniversal,
        handleWhatsAppSlot,
        confirmNextSlot,
        handleHardEdit,
        handleOpenPayment,
        handleOpenHistory,
        handleOpenPrescribe,
        handleOpenReschedule,
        handleOpenSync,
        handleSelectMedication,
        syncDayToGoogle,
        handleUpdateType,
        handleSaveNote,
        handleAdminAuthConfirm,

        // Misc
        rescheduleAppt,
        exitRescheduleMode,
        fetchAppointments
    } = controller;

    if (loading) return <div className="centered-loader"><div className="status-display__spinner"></div></div>;

    return (
        <MainLayout>
            <RescheduleBanner
                rescheduleAppt={rescheduleAppt}
                onExit={exitRescheduleMode}
                t={t}
            />

            <div className="appointments-nav-group">
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

            <div className="tab-content animate-fadeIn">
                {searchPatientId ? (
                    <PatientHistoryView
                        patientAppointments={patientAppointments}
                        loading={patientApptLoading}
                        onClose={() => setSearchPatientId('')}
                        t={t}
                        searchPatientId={searchPatientId}
                        handlers={controller}
                    />
                ) : activeTab === 'upcoming' ? (
                    <UpcomingAppointmentsView
                        appointments={filteredAppointments}
                        loading={loading}
                        t={t}
                        onAction={(a) => setActionModal({ open: true, appt: a })}
                        onWhatsApp={handleWhatsAppUniversal}
                    />
                ) : (
                    <div className="appointments-grid" style={activeTab === 'monthly' ? { gridTemplateColumns: '1fr' } : {}}>
                        <CalendarSection
                            activeTab={activeTab}
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            appointments={filteredAppointments}
                            calendarStats={calendarStats}
                            holidays={holidays}
                            onAddHoliday={handleAddHoliday}
                        />

                        {activeTab !== 'monthly' && (
                            <ScheduleSection
                                activeTab={activeTab}
                                selectedDate={selectedDate}
                                onDateSelect={handleDateSelect}
                                selectedDoctor={currentDoctor}
                                viewDoctorId={viewDoctorId}
                                appointments={appointments}
                                doctorSchedule={doctorSchedule}
                                holidays={holidays}
                                onSlotClick={handleSlotClick}
                                onDeleteHoliday={handleDeleteHoliday}
                                showForm={booking.showForm}
                                onToggleForm={booking.toggleForm}
                                onSearchPatientId={setSearchPatientId}
                                searchPatientId={searchPatientId}
                                onCreatePatient={booking.createPatient}
                                onNextFreeSlot={nextSlot.openNextSlot}
                                onSyncDayToGoogle={() => syncDayToGoogle(viewDoctorId, selectedDate)}
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
                onHistory={handleOpenHistory}
                onPrescribe={handleOpenPrescribe}
                onUpdateStatus={handleUpdateStatus}
                onReschedule={handleOpenReschedule}
                onCancel={handleCancel}
                onDelete={handleDelete}
                onSync={handleOpenSync}
                onPay={handleOpenPayment}
                onWhatsApp={handleWhatsAppUniversal}
                onUpdateType={handleUpdateType}
                onHardEdit={handleHardEdit}
                onSaveNote={handleSaveNote}
                fetchAppointments={fetchAppointments}
            />

            <Modal
                isOpen={prescribeModal.open}
                onClose={() => setPrescribeModal({ ...prescribeModal, open: false })}
                title={`${t('prescription_for')} ${prescribeModal.patientName}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setPrescribeModal({ ...prescribeModal, open: false })}>{t('cancel')}</Button>
                        <Button onClick={handleSavePrescription} disabled={!prescribeModal.medications.trim()}>{t('create')}</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="input-group">
                        <label className="input-label">{t('medications')}</label>
                        <MedicationAutocomplete
                            value=""
                            onChange={() => { }}
                            onSelectMedication={handleSelectMedication}
                        />
                        <textarea className="input-field mt-2" rows="4" value={prescribeModal.medications} onChange={e => setPrescribeModal({ ...prescribeModal, medications: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('instructions')}</label>
                        <textarea className="input-field" rows="3" value={prescribeModal.instructions} onChange={e => setPrescribeModal({ ...prescribeModal, instructions: e.target.value })} />
                    </div>
                </div>
            </Modal>

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
                    handleNextFreeSlot(null, val);
                }}
                onSelect={confirmNextSlot}
                onWhatsApp={handleWhatsAppSlot}
                onLoadMore={nextSlot.loadMoreSlots}
                hasMore={!!nextSlot.nextSlotData?.nextStartDate}
            />

            {editPatientModalOpen && (
                <PatientEditModal
                    isOpen={editPatientModalOpen}
                    onClose={() => setEditPatientModalOpen(false)}
                    patient={booking.selectedPatientData}
                    referenceInfo={booking.syncReferenceInfo}
                    onUpdate={(updatedData) => {
                        booking.setSelectedPatient(updatedData.id);
                        booking.setSelectedPatientData(updatedData);
                    }}
                />
            )}

            {booking.showForm && (
                <AppointmentFormModal
                    isOpen={booking.showForm}
                    onClose={() => booking.setShowForm(false)}
                    {...booking}
                    onSubmit={controller.handleBook}
                    doctors={doctors}
                    institutions={controller.institutions}
                    onOpenEditPatient={() => setEditPatientModalOpen(true)}
                    t={t}
                    handlers={booking.handlers}
                />
            )}

            <AdminAuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                onConfirm={handleAdminAuthConfirm}
            />

            <TransactionModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                initialData={paymentModal.initialData}
                onSuccess={async () => {
                    controller.fetchAppointments();
                }}
            />
        </MainLayout>
    );
};

export default Appointments;
