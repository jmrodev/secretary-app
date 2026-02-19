import React from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import MedicationAutocomplete from './MedicationAutocomplete';

/**
 * EditPrescriptionModal Molecule.
 * Modal for editing an existing medical prescription.
 */
const EditPrescriptionModal = ({
    isOpen,
    onClose,
    prescription,
    editData,
    onEditDataChange,
    onSelectMedication,
    onUpdate,
    t
}) => {
    if (!isOpen || !prescription) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('prescription_for')} ${prescription.patient_name}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={onUpdate}>{t('save')}</Button>
                </>
            }
        >
            <div className="config-flex--column config-flex--gap-4">
                <div className="input-group">
                    <label className="input-label">{t('medications')}</label>
                    <MedicationAutocomplete
                        value=""
                        onChange={() => { }}
                        onSelectMedication={onSelectMedication}
                    />
                    <textarea
                        className="input-field mt-4"
                        rows="4"
                        value={editData.medications}
                        onChange={e => onEditDataChange('medications', e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('instructions')}</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        value={editData.instructions}
                        onChange={e => onEditDataChange('instructions', e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default EditPrescriptionModal;
