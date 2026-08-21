
import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Checkbox } from '@/components/atoms/Checkbox';
import { FormGroup } from '@/components/molecules/FormGroup';
import { MedicationAutocomplete } from '@/features/medical_documents/components/ui/MedicationAutocomplete';
import { PrescriptionItemsList } from '@/features/medical_documents/components/lists/PrescriptionItemsList';

/**
 * EditPrescriptionModal Molecule.
 * Modal for editing an existing medical prescription.
 */
export const EditPrescriptionModal = ({
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
                <FormGroup label={t('medications')} htmlFor="edit-prescription-medications">
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
                    <Input
                        type="textarea"
                        id="edit-prescription-medications"
                        rows={4}
                        readOnly={editData._readOnly}
                        value={editData.medications}
                        onChange={e => onEditDataChange('medications', e.target.value)}
                    />
                </FormGroup>
                <FormGroup label={t('instructions')} htmlFor="edit-prescription-instructions">
                    <Input
                        type="textarea"
                        id="edit-prescription-instructions"
                        rows={3}
                        readOnly={editData._readOnly}
                        value={editData.instructions}
                        onChange={e => onEditDataChange('instructions', e.target.value)}
                    />
                </FormGroup>
                {!editData._readOnly && (
                    <Checkbox
                        id="edit-prescription-bonified"
                        checked={editData.bonified || false}
                        onChange={e => onEditDataChange('bonified', e.target.checked)}
                        label={t('bonified') || 'Bonificado (Sin Costo)'}
                    />
                )}
            </div>
        </Modal>
    );
};

