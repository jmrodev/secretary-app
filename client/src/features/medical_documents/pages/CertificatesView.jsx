import React, { useState } from 'react';
import { useCertificatesController } from '../hooks/useCertificatesController';
import { MedicalHistoryTable } from '../components/lists/MedicalHistoryTable';
import { EditRequestModal } from '../components/modals/EditRequestModal';
import { MedicalRequestForm } from '../components/forms/MedicalRequestForm';
import { PatientSearchSelect } from '@/features/patients';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

export const CertificatesView = () => {
    const controller = useCertificatesController();
    const [isCreating, setIsCreating] = useState(false);
    
    const {
        t, loading, isEditing, setIsEditing,
        items, canDelete,
        page, setPage, totalPages,
        selectedCertificate, editData,
        fetchHistory, handleUpdate, handleDelete, handleEditItem,
        handleEditDataChange
    } = controller;

    const getNewButtonLabel = () => t('new_certificate') || 'Nuevo Certificado';

    return (
        <article className={`medical-documents__certificates-layout`}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={() => setIsCreating(true)} icon={<Icon name="add" />}>
                    {getNewButtonLabel()}
                </Button>
            </div>

            <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title={getNewButtonLabel()}>
                <MedicalRequestForm
                    initialType="certificate"
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
                icon="verified"
                title={t('recent_certificates')}
                originLabel={t('certificate')}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />

            <EditRequestModal
                isOpen={isEditing && !!selectedCertificate}
                onClose={() => setIsEditing(false)}
                request={selectedCertificate}
                editData={editData}
                onEditDataChange={handleEditDataChange}
                onUpdate={handleUpdate}
                t={t}
            />
        </article>
    );
};

