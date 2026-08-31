import React, { useState } from 'react';
import { useLicensesController } from '../hooks/useLicensesController';
import { MedicalHistoryTable } from '../components/lists/MedicalHistoryTable';
import { EditLicenseModal } from '../components/modals/EditLicenseModal';
import { MedicalRequestForm } from '../components/forms/MedicalRequestForm';
import { PatientSearchSelect } from '@/features/patients/components/ui/PatientSearchSelect';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import styles from './MedicalDocPages.module.css';

export const LicensesView = () => {
    const controller = useLicensesController();
    const [isCreating, setIsCreating] = useState(false);
    
    const {
        t, loading, isEditing, setIsEditing,
        items, canDelete,
        page, setPage, totalPages,
        selectedLicense, editData,
        fetchHistory, handleUpdate, handleDelete, handleEditItem,
        handleEditDataChange
    } = controller;

    const getNewButtonLabel = () => t('new_license');

    return (
        <article className={`medical-documents__licenses-layout`}>
            <div className={styles.MedicalDocPages__actionRow}>
                <Button variant="primary" onClick={() => setIsCreating(true)} icon={<Icon name="add" />}>
                    {getNewButtonLabel()}
                </Button>
            </div>

            <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title={getNewButtonLabel()}>
                <MedicalRequestForm
                    initialType="license"
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
                icon="description"
                title={t('recent_licenses')}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />

            <EditLicenseModal
                isOpen={isEditing && !!selectedLicense}
                onClose={() => setIsEditing(false)}
                license={selectedLicense}
                editData={editData}
                onEditDataChange={handleEditDataChange}
                onUpdate={handleUpdate}
                t={t}
            />
        </article>
    );
};

