
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
                    <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
                ) : (
                    <>
                        <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                        <Button onClick={onUpdate}>{t('save')}</Button>
                    </>
                )
            }
        >
            <div className="config-flex--column config-flex--gap-4">
                {editData._readOnly ? (
                    <>
                        {editData.items && editData.items.length > 0 && (
                            <div className="prescription-modal mb-4">
                                <PrescriptionItemsList
                                    items={editData.items}
                                    handleRemoveItem={() => { }}
                                    t={t}
                                    readOnly={true}
                                />
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--dashboard-card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('medications')}
                            </span>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                {editData.medications || t('none')}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--dashboard-card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('instructions')}
                            </span>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                {editData.instructions || t('none')}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <FormGroup label={t('medications')} htmlFor="edit-prescription-medications">
                            {editData.items && editData.items.length > 0 && (
                                <div className="prescription-modal mb-4">
                                    <PrescriptionItemsList
                                        items={editData.items}
                                        handleRemoveItem={() => { }}
                                        t={t}
                                        readOnly={true}
                                    />
                                </div>
                            )}
                            <MedicationAutocomplete
                                value=""
                                onChange={() => { }}
                                onSelectMedication={onSelectMedication}
                            />
                            <Input
                                type="textarea"
                                id="edit-prescription-medications"
                                rows={4}
                                value={editData.medications}
                                onChange={e => onEditDataChange('medications', e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup label={t('instructions')} htmlFor="edit-prescription-instructions">
                            <Input
                                type="textarea"
                                id="edit-prescription-instructions"
                                rows={3}
                                value={editData.instructions}
                                onChange={e => onEditDataChange('instructions', e.target.value)}
                            />
                        </FormGroup>
                        <Checkbox
                            id="edit-prescription-bonified"
                            checked={editData.bonified || false}
                            onChange={e => onEditDataChange('bonified', e.target.checked)}
                            label={t('bonified')}
                        />
                    </>
                )}
            </div>
        </Modal>
    );
};

