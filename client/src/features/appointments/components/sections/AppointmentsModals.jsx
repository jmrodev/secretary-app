import React from 'react';
import AppointmentActionModal from '../modals/AppointmentActionModal';
import AppointmentFormModal from '../modals/AppointmentFormModal';

export const AppointmentsModals = ({
    doctors, institutions, booking, nextSlot,
    paymentModal,
    actionModal, setActionModal,
    historyModal,
    prescribeModal,
    whatsappModal,
    showNextSlotModal, setShowNextSlotModal,
    editPatientModalOpen, setEditPatientModalOpen,
    authModalOpen,
    handlers, t,
    prescriptionModalSlot,
    patientHistoryModalSlot,
    patientManagerModalSlot,
    whatsappModalSlot,
    adminAuthModalSlot,
    transactionModalSlot,
    PatientSearchSelectComponent
}) => (
    <>
        <AppointmentActionModal
            isOpen={actionModal.open} onClose={() => setActionModal(prev => ({ ...prev, open: false }))}
            appt={actionModal.appt} doctors={doctors} onHistory={handlers.handleOpenHistory}
            onPrescribe={handlers.handleOpenPrescribe} onUpdateStatus={handlers.handleUpdateStatus}
            onReschedule={handlers.handleOpenReschedule} onCancel={handlers.handleCancel} onDelete={handlers.handleDelete}
            onSync={handlers.handleOpenSync} onPay={handlers.handleOpenPayment} onWhatsApp={handlers.handleWhatsAppUniversal}
            onUpdateType={handlers.handleUpdateType} onHardEdit={handlers.handleHardEdit} onBonify={handlers.handleBonify}
            onSaveNote={handlers.handleSaveNote} fetchAppointments={handlers.fetchAppointments}
        />

        {prescribeModal.open && prescriptionModalSlot}

        {historyModal.open && patientHistoryModalSlot}

        {whatsappModal.open && whatsappModalSlot}

        {/* ECC: NextSlotModal removed - Replaced by SlotExplorerDropdown inline in AppointmentsPage */}

        {editPatientModalOpen && patientManagerModalSlot}

        {booking.showForm && (
            <AppointmentFormModal
                isOpen={booking.showForm} onClose={() => booking.setShowForm(false)}
                {...booking} onSubmit={handlers.handleBook} doctors={doctors} institutions={institutions}
                onOpenEditPatient={() => setEditPatientModalOpen(true)} t={t} handlers={booking.handlers}
                PatientSearchSelectComponent={PatientSearchSelectComponent}
            />
        )}

        {authModalOpen && adminAuthModalSlot}
        
        {paymentModal.open && transactionModalSlot}
    </>
);
