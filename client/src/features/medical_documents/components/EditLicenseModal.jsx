
import React from 'react';
import Modal from '../../../components/molecules/Modal';
import Button from '../../../components/atoms/Button';

/**
 * EditLicenseModal Molecule.
 * Modal for editing an existing medical license.
 */
const EditLicenseModal = ({
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
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={onUpdate}>{t('save')}</Button>
                </>
            }
        >
            <div className="config-flex--column config-flex--gap-4">
                <div className="config-grid config-grid--2col">
                    <div className="input-group">
                        <label className="input-label">{t('start_date')}</label>
                        <input
                            type="date"
                            className="input-field"
                            value={editData.start_date || ''}
                            onChange={e => onEditDataChange('start_date', e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('days_duration')}</label>
                        <input
                            type="number"
                            className="input-field"
                            value={editData.days_duration || ''}
                            onChange={e => onEditDataChange('days_duration', e.target.value)}
                        />
                    </div>
                </div>
                <div className="input-group">
                    <label className="input-label">{t('diagnosis')}</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        value={editData.diagnosis || ''}
                        onChange={e => onEditDataChange('diagnosis', e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default EditLicenseModal;
