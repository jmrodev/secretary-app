import React from 'react';
import { useMedicalRequestsController } from '../hooks/useMedicalRequestsController';
import { MedicalRequestList } from '../components/lists/MedicalRequestList';
import { StatusActionModal } from '../components/modals/StatusActionModal';
import { EditRequestModal } from '../components/modals/EditRequestModal';
import { TransactionModal } from '@/features/finances/components/modals/TransactionModal';
import { MedicationInput } from '@/features/medical_documents/components/forms/MedicationInput';

export const RequestsView = () => {
    const controller = useMedicalRequestsController();
    const {
        user, t,
        requests,
        requestsPage, requestsTotalPages,
        canDeleteRequest,
        isEditing, setIsEditing, actionModal, actionNote,
        paymentModal, selectedRequest, requestEditData,
        handlers, loading
    } = controller;

    const {
        handleSubTabChange, openActionModal, openPaymentModal,
        handleDeleteRequest, handleEditItem, fetchRequests
    } = handlers;

    return (
        <article className="medical-documents__requests-layout">
            <MedicalRequestList
                requests={requests}
                loading={loading}
                handleDeleteRequest={handleDeleteRequest}
                openActionModal={openActionModal}
                setPaymentModal={openPaymentModal}
                onBonify={handlers.handleBonifyRequest}
                canDelete={user?.role === 'admin' || canDeleteRequest}
                handleEditRequest={handleEditItem}
                currentPage={requestsPage}
                totalPages={requestsTotalPages}
                onPageChange={handlers.handlePageChange}
            />
            
            <StatusActionModal
                isOpen={actionModal?.open}
                onClose={handlers.closeActionModal}
                type={actionModal?.type}
                id={actionModal?.id}
                note={actionNote}
                onNoteChange={handlers.setActionNote}
                onUpdateStatus={handlers.handleUpdateStatus}
                t={t}
            />

            <TransactionModal
                isOpen={paymentModal?.open}
                onClose={handlers.closePaymentModal}
                initialData={paymentModal?.initialData}
                requestId={paymentModal?.reqId}
                onSuccess={fetchRequests}
                MedicationInputComponent={MedicationInput}
            />

            <EditRequestModal
                isOpen={isEditing && !!selectedRequest}
                onClose={() => setIsEditing(false)}
                request={selectedRequest}
                editData={requestEditData}
                onEditDataChange={handlers.handleRequestEditDataChange}
                onUpdate={handlers.handleUpdateRequest}
                t={t}
            />
        </article>
    );
};

