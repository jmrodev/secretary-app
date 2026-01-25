
import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointmentsPageController } from '../controllers/useAppointmentsPageController';
import Button from '../components/atoms/Button';

// Components
import CalendarSection from '../components/organisms/CalendarSection';
import ScheduleSection from '../components/organisms/ScheduleSection';
import Sidebar from '../components/organisms/Sidebar';
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
import NextSlotModal from '../components/molecules/NextSlotModal';
import WhatsAppModal from '../components/molecules/WhatsAppModal';
import AdminAuthModal from '../components/molecules/AdminAuthModal';
import PatientHistoryView from '../components/organisms/PatientHistoryView';
import UpcomingAppointmentsView from '../components/organisms/UpcomingAppointmentsView';
import PatientSearchSelect from '../components/molecules/PatientSearchSelect';

const Appointments = () => {
    const navigate = useNavigate();
    // Logic extracted to Custom Hook (Controller)
    const controller = useAppointmentsPageController();
    const {
        t, user,
        loading,
        activeTab, setActiveTab,
        viewDoctorId, setViewDoctorId,
        doctors,
        // Data
        selectedDate,
        filteredAppointments,
        appointments,
        doctorSchedule,
        holidays,
        currentDoctor,
        searchPatientId, setSearchPatientId,
        patientAppointments, patientApptLoading,

        // Modals State & Setters
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
        addHoliday, deleteHoliday,
        booking,
        nextSlot,
        handleUpdateStatus,
        handleCancel,
        handleDelete,
        handleReschedule,
        handleSyncGoogleEvent,
        handleSavePrescription,
        handleWhatsAppUniversal,
        handleWhatsAppSlot,
        confirmNextSlot,
        handleNextPage, handlePrevPage,
        handleAdminAuthConfirm,
        handleNextFreeSlot,
        refreshGoogleEvents,

        // Misc
        rescheduleAppt,
        exitRescheduleMode,
    } = controller;

    if (loading) return <div>{t('loading')}</div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <RescheduleBanner
                    rescheduleAppt={rescheduleAppt}
                    onExit={exitRescheduleMode}
                    t={t}
                />

                <NavTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    userRole={user.role}
                />

                <DoctorFilter
                    activeTab={activeTab}
                    userRole={user.role}
                    viewDoctorId={viewDoctorId}
                    setViewDoctorId={(val) => setViewDoctorId(val)}
                    doctors={doctors}
                />

                {searchPatientId ? (
                    <PatientHistoryView
                        patientAppointments={patientAppointments}
                        loading={patientApptLoading}
                        onClose={() => setSearchPatientId('')}
                        t={t}
                        setSelectedDate={controller.setSelectedDate}
                        setViewDoctorId={setViewDoctorId}
                        setSelectedPatient={controller.booking.setSelectedPatient}
                        setShowForm={controller.booking.setShowForm}
                        setReason={controller.booking.setReason}
                        searchPatientId={searchPatientId}
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
                    <div className="appointments-tab-content">
                        <div className="appointments-grid">
                            <CalendarSection
                                activeTab={activeTab}
                                selectedDate={selectedDate}
                                onDateSelect={handleDateSelect}
                                appointments={filteredAppointments}
                                holidays={holidays}
                                onAddHoliday={addHoliday}
                            />

                            <ScheduleSection
                                activeTab={activeTab}
                                selectedDate={selectedDate}
                                selectedDoctor={currentDoctor}
                                viewDoctorId={viewDoctorId}
                                appointments={appointments}
                                doctorSchedule={doctorSchedule}
                                holidays={holidays}
                                onSlotClick={handleSlotClick}
                                onDeleteHoliday={deleteHoliday}
                                showForm={booking.showForm}
                                onToggleForm={() => booking.setShowForm(!booking.showForm)}
                                onSearchPatientId={(val) => setSearchPatientId(val)}
                                searchPatientId={searchPatientId}
                                onCreatePatient={() => {
                                    booking.setSelectedPatientData(null);
                                    setEditPatientModalOpen(true);
                                }}
                                onNextFreeSlot={() => {
                                    nextSlot.setSlotHistory([]);
                                    handleNextFreeSlot(null);
                                }}
                                onRefreshGoogle={() => refreshGoogleEvents(false)}
                            />
                        </div>
                    </div>
                )}

                {/* --- MODALS SECTION --- */}

                <AppointmentActionModal
                    isOpen={actionModal.open}
                    onClose={() => setActionModal({ ...actionModal, open: false })}
                    appt={actionModal.appt}
                    doctors={doctors}
                    onHistory={(appt) => setHistoryModal({ open: true, patientId: appt.patient_id, patientName: appt.patient_name })}
                    onPrescribe={(appt) => setPrescribeModal({ open: true, apptId: appt.id, patientName: appt.patient_name, medications: '', instructions: '' })}
                    onUpdateStatus={handleUpdateStatus}
                    onReschedule={(appt) => navigate('/appointments', { state: { rescheduleAppt: appt } })}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                    onSync={handleSyncGoogleEvent}
                    onPay={(appt) => console.log("Pay not impl in controller yet, TODO")} // Simplify for now or pass handler
                    onWhatsApp={handleWhatsAppUniversal}
                    fetchAppointments={controller.fetchAppointments}
                />

                <Modal
                    isOpen={prescribeModal.open}
                    onClose={() => setPrescribeModal({ ...prescribeModal, open: false })}
                    title={`${t('prescription_for') || 'Receta para'} ${prescribeModal.patientName}`}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setPrescribeModal({ ...prescribeModal, open: false })}>{t('cancel')}</Button>
                            <Button variant="primary" onClick={handleSavePrescription} disabled={!prescribeModal.medications.trim()}>{t('create')}</Button>
                        </>
                    }
                >
                    <div className="flex-col-gap-4">
                        <div className="input-group">
                            <label className="input-label">{t('medications')}</label>
                            <MedicationAutocomplete
                                value=""
                                onChange={() => { }}
                                placeholder={t('search_medication') || "Buscar medicamento..."}
                                onSelectMedication={(med) => {
                                    const current = prescribeModal.medications.trim();
                                    const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
                                    setPrescribeModal({ ...prescribeModal, medications: newValue });
                                }}
                            />
                            <textarea
                                className="input-field mt-2"
                                rows="4"
                                value={prescribeModal.medications}
                                onChange={e => setPrescribeModal({ ...prescribeModal, medications: e.target.value })}
                                placeholder={t('meds_placeholder') || "ej. Ibuprofeno 600mg"}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('instructions')}</label>
                            <textarea className="input-field" rows="3" value={prescribeModal.instructions} onChange={e => setPrescribeModal({ ...prescribeModal, instructions: e.target.value })} placeholder={t('instructions_placeholder') || "ej. Tomar cada 8 horas con comida."} />
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

                <NextSlotModal
                    isOpen={showNextSlotModal}
                    onClose={() => setShowNextSlotModal(false)}
                    loading={nextSlot.loading}
                    nextSlotData={nextSlot.nextSlotData}
                    includeOutOfHours={nextSlot.includeOutOfHours}
                    onToggleOutOfHours={(val) => {
                        nextSlot.setIncludeOutOfHours(val);
                        handleNextFreeSlot(null, val);
                    }}
                    slotsPage={nextSlot.slotsPage}
                    setSlotsPage={nextSlot.setSlotsPage}
                    slotPages={nextSlot.slotPages}
                    onSelect={confirmNextSlot}
                    onWhatsApp={handleWhatsAppSlot}
                    onNextGroup={handleNextPage}
                    onPrevGroup={handlePrevPage}
                    hasPrevGroup={nextSlot.slotHistory.length > 0}
                    hasNextGroup={!!nextSlot.nextSlotData?.nextStartDate}
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
                    />
                )}

                <AdminAuthModal
                    isOpen={authModalOpen}
                    onClose={() => setAuthModalOpen(false)}
                    onConfirm={handleAdminAuthConfirm}
                />
            </main >
        </div >
    );
};

export default Appointments;
