import React from 'react';
import Modal from '@/components/molecules/Modal';
import MedicalRequestForm from '../forms/MedicalRequestForm';

/**
 * MedicalRequestModal Organism (Feature-based).
 * Modal wrapper for MedicalRequestForm.
 */
const MedicalRequestModal = ({ isOpen, onClose, doctors, t, onRequestCreated }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('new_request')}
            size="xl"
        >
            <MedicalRequestForm 
                doctors={doctors} 
                onRequestCreated={() => {
                    onRequestCreated();
                    onClose();
                }}
                noCard
            />
        </Modal>
    );
};

export default MedicalRequestModal;
