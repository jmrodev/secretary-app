import React from 'react';
import Modal from '@/components/molecules/Modal';
import { MedicalRequestForm } from '../forms/MedicalRequestForm';

/**
 * MedicalRequestModal Organism (Feature-based).
 * Modal wrapper for MedicalRequestForm.
 */
export const MedicalRequestModal = ({ isOpen, onClose, doctors, t, onRequestCreated }) => {
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
                    if (typeof onRequestCreated === 'function') {
                        onRequestCreated();
                    }
                    if (typeof onClose === 'function') {
                        onClose();
                    }
                }}
                noCard
            />
        </Modal>
    );
};

