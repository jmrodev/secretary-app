import React, { useState } from 'react';
import { usePrescriptionsController } from '../hooks/usePrescriptionsController';
import { MedicalHistoryTable } from '../components/lists/MedicalHistoryTable';
import { EditPrescriptionModal } from '../components/modals/EditPrescriptionModal';
import { MedicalRequestForm } from '../components/forms/MedicalRequestForm';
import { PatientSearchSelect } from '@/features/patients';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

export const PrescriptionsView = () => {
    const controller = usePrescriptionsController();
    const [isCreating, setIsCreating] = useState(false);
    
    const {
        t, loading, isEditing, setIsEditing,
        items, canDelete,
        page, setPage, totalPages,
        selectedPrescription, editData,
        fetchHistory, handleUpdate, handleDelete, handleEditItem,
        handleEditDataChange, handleSelectMedication
    } = controller;

    const getNewButtonLabel = () => t('new_prescription') || 'Nueva Receta';

    return (
        <article className={`medical-documents__prescriptions-layout`}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={() => setIsCreating(true)} icon={<Icon name="add" />}>
                    {getNewButtonLabel()}
                </Button>
            </div>

            <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title={getNewButtonLabel()}>
                <MedicalRequestForm
                    initialType="prescription"
                    lockedType={true}
                    noCard={true}
                    onRequestCreated={() => {
                        setIsCreating(false);
                        fetchHistory();
                    }}
                    PatientSearchSelectComponent={PatientSearchSelect}
                />
            </Modal>

            <MedicalHistoryTable
                items={items}
                loading={loading}
                onView={handleEditItem}
                onDelete={handleDelete}
                canDelete={canDelete}
                icon="medication"
                title={t('recent_prescriptions')}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />

            <EditPrescriptionModal
                isOpen={isEditing && !!selectedPrescription}
                onClose={() => setIsEditing(false)}
                prescription={selectedPrescription}
                editData={editData}
                onEditDataChange={handleEditDataChange}
                onSelectMedication={handleSelectMedication}
                onUpdate={handleUpdate}
                t={t}
            />
        </article>
    );
};

