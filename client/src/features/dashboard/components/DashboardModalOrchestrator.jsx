import React from 'react';
import { AppointmentActionModal } from '@/features/appointments/components/modals/AppointmentActionModal';
import { PrescriptionModal } from '@/features/medical_documents/components/modals/PrescriptionModal';
import { PatientHistoryModal } from '@/features/patients/components/modals/PatientHistoryModal';
import { TransactionModal } from '@/features/finances/components/modals/TransactionModal';
import { MedicalRequestModal } from '@/features/medical_documents/components/modals/MedicalRequestModal';
import { MedicationInput } from '@/features/medical_documents/components/forms/MedicationInput';

/**
 * DashboardModalOrchestrator.
 * Centralizes all domain modals for the DashboardPage to reduce coupling in the main page.
 */
export const DashboardModalOrchestrator = ({ controller }) => {
    const {
        t,
        actionModal,
        historyModal,
        prescribeModal,
        paymentModal,
        newRequestModal,
        isSubmitting,
        doctors,
        handlers,
        refreshDashboard
    } = controller;

    const {
        handleUpdateStatus,
        handleDelete,
        handleCancel,
        handleWhatsApp,
        handlePrescriptionSubmit,
        handleOpenPayment,
        handleOpenHistory,
        handleOpenPrescribe,
        handleOpenReschedule,
        handleOpenSync,
        handleUpdateType,
        handleHardEdit,
        handleSaveNote,
        setActionModal,
        setHistoryModal,
        setPrescribeModal,
        setPaymentModal,
        setNewRequestModal
    } = handlers;

    return (
        <>
            <AppointmentActionModal
                isOpen={actionModal.open}
                onClose={() => setActionModal(prev => ({ ...prev, open: false }))}
                appt={actionModal.appt}
                doctors={doctors}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
                onCancel={handleCancel}
                onPay={handleOpenPayment}
                onWhatsApp={handleWhatsApp}
                onUpdateType={handleUpdateType}
                onHardEdit={handleHardEdit}
                onHistory={handleOpenHistory}
                onPrescribe={handleOpenPrescribe}
                onReschedule={handleOpenReschedule}
                onSync={handleOpenSync}
                onSaveNote={handleSaveNote}
                fetchAppointments={controller.refreshDashboard}
            />

            {prescribeModal.open && (
                <PrescriptionModal
                    isOpen={prescribeModal.open}
                    onClose={() => setPrescribeModal(prev => ({ ...prev, open: false }))}
                    patientName={prescribeModal.patientName}
                    patientId={prescribeModal.patientId}
                    onSubmit={handlePrescriptionSubmit}
                    t={t}
                    isSubmitting={isSubmitting}
                />
            )}

            {historyModal.open && (
                <PatientHistoryModal
                    isOpen={historyModal.open}
                    onClose={() => setHistoryModal(prev => ({ ...prev, open: false }))}
                    patientId={historyModal.patientId}
                    patientName={historyModal.patientName}
                />
            )}

            {paymentModal.open && (
                <TransactionModal
                    isOpen={paymentModal.open}
                    onClose={() => setPaymentModal(prev => ({ ...prev, open: false }))}
                    initialData={{
                        ...paymentModal.initialData,
                        appointment_id: paymentModal.apptId || paymentModal.initialData?.apptId
                    }}
                    requestId={paymentModal.reqId || paymentModal.initialData?.reqId}
                    onSuccess={async () => {
                        controller.refreshDashboard();
                        setPaymentModal(prev => ({ ...prev, open: false }));
                    }}
                    t={t}
                    MedicationInputComponent={MedicationInput}
                />
            )}

            <MedicalRequestModal 
                isOpen={newRequestModal.open}
                onClose={() => setNewRequestModal({ open: false })}
                doctors={doctors}
                t={t}
                onRequestCreated={controller.refreshDashboard}
            />
        </>
    );
};
