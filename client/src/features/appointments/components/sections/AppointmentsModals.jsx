import React from 'react';
import AppointmentActionModal from '../modals/AppointmentActionModal';
import { PrescriptionModal } from '@/features/medical_documents';
import { PatientHistoryModal, PatientManagerModal } from '@/features/patients';
import WhatsAppModal from '@/features/chat/components/ui/WhatsAppModal';
import AppointmentFormModal from '../modals/AppointmentFormModal';
import AdminAuthModal from '@/features/auth/components/modals/AdminAuthModal';
import { TransactionModal } from '@/features/finances';

export const AppointmentsModals = ({
    doctors, insurances, institutions, booking, nextSlot,
    paymentModal, setPaymentModal,
    actionModal, setActionModal,
    historyModal, setHistoryModal,
    prescribeModal, setPrescribeModal,
    whatsappModal, setWhatsappModal,
    showNextSlotModal, setShowNextSlotModal,
    editPatientModalOpen, setEditPatientModalOpen,
    authModalOpen, setAuthModalOpen,
    handlers, loading, t
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

        {/* ECC: NextSlotModal removed - Replaced by SlotExplorerDropdown inline in AppointmentsPage */}

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
    </>
);
