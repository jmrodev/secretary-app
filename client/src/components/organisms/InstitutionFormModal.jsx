import React from 'react';
import Modal from '../molecules/Modal';
import InstitutionForm from './InstitutionForm';

const InstitutionFormModal = ({ isOpen, onClose, onSubmit, formData, onChange, isEditing, t }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? t('edit_institution') : t('new_institution')}
        >
            <InstitutionForm
                formData={formData}
                onChange={onChange}
                onSubmit={onSubmit}
                onCancel={onClose}
                isEditing={isEditing}
            />
        </Modal>
    );
};

export default InstitutionFormModal;
