import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';

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
            title={`${t('license_for') || 'Licencia para'} ${license.patient_name}`}
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
                    <label className="input-label">{t('request_note') || 'Descripción de la licencia'}</label>
                    <textarea
                        className="input-field"
                        rows="4"
                        readOnly={editData._readOnly}
                        value={editData.request_note || ''}
                        onChange={e => onEditDataChange('request_note', e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('doctor_note') || 'Nota del médico'}</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        readOnly={editData._readOnly}
                        value={editData.doctor_note || ''}
                        onChange={e => onEditDataChange('doctor_note', e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};

