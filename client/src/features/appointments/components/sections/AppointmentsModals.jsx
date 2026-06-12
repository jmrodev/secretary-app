import React from 'react';
import AppointmentActionModal from '../modals/AppointmentActionModal';
import NextSlotModal from '../modals/NextSlotModal';
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
    transactionModalSlot
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

        {editPatientModalOpen && patientManagerModalSlot}

        {booking.showForm && (
            <AppointmentFormModal
                isOpen={booking.showForm} onClose={() => booking.setShowForm(false)}
                {...booking} onSubmit={handlers.handleBook} doctors={doctors} institutions={institutions}
                onOpenEditPatient={() => setEditPatientModalOpen(true)} t={t} handlers={booking.handlers}
            />
        )}

        {authModalOpen && adminAuthModalSlot}
        
        {paymentModal.open && transactionModalSlot}
    </>
);
