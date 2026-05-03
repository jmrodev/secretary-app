
import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import PrescriptionItemsList from '@/features/medical_documents/components/PrescriptionItemsList';
import './EditRequestModal.css';

/**
 * EditRequestModal Molecule.
 * Modal for editing general medical requests and their replies.
 */
const EditRequestModal = ({
    isOpen,
    onClose,
    request,
    editData,
    onEditDataChange,
    onUpdate,
    t
}) => {
    if (!isOpen || !request) return null;

    const isReadOnly = editData._readOnly;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="modal-header__title-flex">
                    <Icon name="edit_note" size="1.5rem" color="var(--accent-color)" />
                    {t('edit_request')}
                </div>
            }
            className="modal-content--premium"
            footer={
                isReadOnly ? (
                    <Button variant="secondary" onClick={onClose}>
                        {t('close')}
                    </Button>
                ) : (
                    <>
                        <Button variant="secondary" onClick={onClose}>
                            {t('cancel')}
                        </Button>
                        <Button variant="primary" onClick={onUpdate}>
                            <Icon name="save" size="1.1rem" />
                            {t('save')}
                        </Button>
                    </>
                )
            }
        >
            <div className="edit-request-modal__body">
                {request.type === 'prescription' && editData.items && editData.items.length > 0 && (
                    <div className="edit-request-modal__section">
                        <div className="edit-request-modal__prescriptions">
                            <PrescriptionItemsList
                                items={editData.items}
                                handleRemoveItem={() => { }}
                                t={t}
                                readOnly={true}
                            />
                        </div>
                    </div>
                )}

                <div className="input-group">
                    <label className="input-group__label">
                        <Icon name="description" size="1rem" />
                        {request.type === 'prescription' ? t('medications') : t('request_note')}
                    </label>
                    <textarea
                        className="input-group__textarea"
                        rows="3"
                        readOnly={isReadOnly}
                        value={editData.request_note || ''}
                        onChange={e => onEditDataChange('request_note', e.target.value)}
                        placeholder={t('no_description')}
                    />
                </div>

                <div className="input-group">
                    <label className="input-group__label">
                        <Icon name="medical_services" size="1rem" />
                        {t('doctor_says')}
                    </label>
                    <textarea
                        className="input-group__textarea"
                        rows="3"
                        readOnly={isReadOnly}
                        value={editData.doctor_note || ''}
                        onChange={e => onEditDataChange('doctor_note', e.target.value)}
                        placeholder={t('instructions_notes')}
                    />
                </div>

                {!isReadOnly && (
                    <div className="input-group">
                        <label className="input-group__label">
                            <Icon name="payments" size="1rem" />
                            {t('appointment_payment')}
                        </label>
                        <div className="edit-request-modal__payment-status">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={editData.payment_status === 'bonified'}
                                    onChange={e => onEditDataChange('payment_status', e.target.checked ? 'bonified' : 'debt')}
                                />
                                <span className="checkmark"></span>
                                <span className="checkbox-label">
                                    {t('bonified')}
                                </span>
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default EditRequestModal;
