
import React from 'react';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import MedicationAutocomplete from '@/features/medical_documents/components/ui/MedicationAutocomplete';
import PrescriptionItemsList from '@/features/medical_documents/components/lists/PrescriptionItemsList';

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
            size="xl"
            title={`${t('prescription_for')} ${prescription.patient_name}`}
            footer={
                editData._readOnly ? (
                    <Button variant="secondary" onClick={onClose}>{t('close') || 'Cerrar'}</Button>
                ) : (
                    <>
                        <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                        <Button onClick={onUpdate}>{t('save')}</Button>
                    </>
                )
            }
        >
            <div className="config-flex--column config-flex--gap-4">
                <div className="input-group">
                    <label className="input-label">{t('medications')}</label>
                    {editData.items && editData.items.length > 0 && (
                        <div className="prescription-modal mb-4">
                            <PrescriptionItemsList
                                items={editData.items}
                                handleRemoveItem={() => { }} // Remove handled in full form
                                t={t}
                                readOnly={true}
                            />
                        </div>
                    )}
                    {!editData._readOnly && (
                        <MedicationAutocomplete
                            value=""
                            onChange={() => { }}
                            onSelectMedication={onSelectMedication}
                        />
                    )}
                    <textarea
                        className="input-field mt-4"
                        rows="4"
                        readOnly={editData._readOnly}
                        value={editData.medications}
                        onChange={e => onEditDataChange('medications', e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('instructions')}</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        readOnly={editData._readOnly}
                        value={editData.instructions}
                        onChange={e => onEditDataChange('instructions', e.target.value)}
                    />
                </div>
                {!editData._readOnly && (
                    <div className="input-group">
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={editData.bonified || false}
                                onChange={e => onEditDataChange('bonified', e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            <span className="checkbox-label" style={{ marginLeft: '10px' }}>
                                {t('bonified') || 'Bonificado (Sin Costo)'}
                            </span>
                        </label>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default EditPrescriptionModal;
