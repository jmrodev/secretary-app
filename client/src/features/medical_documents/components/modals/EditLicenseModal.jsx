import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FormGroup } from '@/components/molecules/FormGroup';

/**
 * EditLicenseModal Molecule.
 * Modal for viewing/editing a medical license stored in medical_requests.
 * Fields: request_note (patient description) and doctor_note (doctor's note).
 */
export const EditLicenseModal = ({
    isOpen,
    onClose,
    license,
    editData,
    onEditDataChange,
    onUpdate,
    t
}) => {
    if (!isOpen || !license) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('license_for')} ${license.patient_name}`}
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
                <FormGroup label={t('request_note')} htmlFor="edit-license-request-note">
                    <Input
                        type="textarea"
                        id="edit-license-request-note"
                        rows={4}
                        readOnly={editData._readOnly}
                        value={editData.request_note || ''}
                        onChange={e => onEditDataChange('request_note', e.target.value)}
                    />
                </FormGroup>
                <FormGroup label={t('doctor_note')} htmlFor="edit-license-doctor-note">
                    <Input
                        type="textarea"
                        id="edit-license-doctor-note"
                        rows={3}
                        readOnly={editData._readOnly}
                        value={editData.doctor_note || ''}
                        onChange={e => onEditDataChange('doctor_note', e.target.value)}
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

