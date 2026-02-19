import React from 'react';
import TransactionModal from '../molecules/TransactionModal';

// Molecules
import StatusActionModal from '../molecules/StatusActionModal';
import DeleteFileModal from '../molecules/DeleteFileModal';
import EditPrescriptionModal from '../molecules/EditPrescriptionModal';
import EditLicenseModal from '../molecules/EditLicenseModal';
import EditRequestModal from '../molecules/EditRequestModal';

/**
 * MedicalActionModals Organism.
 * Container for various modals used in the medical request administration workflow.
 * Manages visibility and routing for approval/rejection, payments, deletions, and edits.
 */
const MedicalActionModals = ({
    t,
    isEditing,
    toggleEditing,
    actionModal,
    closeActionModal,
    actionNote,
    handleActionNoteChange,
    handleUpdateStatus,
    paymentModal,
    closePaymentModal,
    fetchRequests,
    fileToDelete,
    closeDeleteFileModal,
    confirmFileDelete,
    selectedPrescription,
    selectedLicense,
    selectedRequest,
    editData,
    handleEditDataChange,
    handleSelectMedication,
    handleUpdatePrescription,
    licenseEditData,
    handleLicenseEditDataChange,
    handleUpdateLicense,
    requestEditData,
    handleRequestEditDataChange,
    handleUpdateRequest
}) => {
    return (
        <>
            {/* Action Modals (Approve/Reject) */}
            <StatusActionModal
                isOpen={actionModal.open}
                onClose={closeActionModal}
                type={actionModal.type}
                id={actionModal.id}
                note={actionNote}
                onNoteChange={handleActionNoteChange}
                onUpdateStatus={handleUpdateStatus}
                t={t}
            />

            {/* Payment Modal */}
            <TransactionModal
                isOpen={paymentModal.open}
                onClose={closePaymentModal}
                initialData={paymentModal.initialData}
                requestId={paymentModal.reqId}
                onSuccess={fetchRequests}
            />

            {/* Delete File Modal */}
            <DeleteFileModal
                file={fileToDelete}
                onClose={closeDeleteFileModal}
                onConfirm={confirmFileDelete}
                t={t}
            />

            {/* Edit Prescription Modal */}
            <EditPrescriptionModal
                isOpen={isEditing && !!selectedPrescription}
                onClose={() => toggleEditing(false)}
                prescription={selectedPrescription}
                editData={editData}
                onEditDataChange={handleEditDataChange}
                onSelectMedication={handleSelectMedication}
                onUpdate={handleUpdatePrescription}
                t={t}
            />

            {/* Edit License Modal */}
            <EditLicenseModal
                isOpen={isEditing && !!selectedLicense}
                onClose={() => toggleEditing(false)}
                license={selectedLicense}
                editData={licenseEditData}
                onEditDataChange={handleLicenseEditDataChange}
                onUpdate={handleUpdateLicense}
                t={t}
            />

            {/* Edit Request Modal */}
            <EditRequestModal
                isOpen={isEditing && !!selectedRequest}
                onClose={() => toggleEditing(false)}
                request={selectedRequest}
                editData={requestEditData}
                onEditDataChange={handleRequestEditDataChange}
                onUpdate={handleUpdateRequest}
                t={t}
            />
        </>
    );
};

export default MedicalActionModals;
