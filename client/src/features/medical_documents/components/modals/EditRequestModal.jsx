
import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { Checkbox } from '@/components/atoms/Checkbox';
import { FormGroup } from '@/components/molecules/FormGroup';
import { PrescriptionItemsList } from '@/features/medical_documents/components/lists/PrescriptionItemsList';
import styles from './EditRequestModal.module.css';

/**
 * EditRequestModal Molecule.
 * Modal for editing general medical requests and their replies.
 */
export const EditRequestModal = ({
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
            size="xl"
            title={
                <div className={`${styles.EditRequestModal__titleFlex}`}>
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
            <div className={`${styles.EditRequestModal__body}`}>
                {request.type === 'prescription' && editData.items && editData.items.length > 0 && (
                    <div className={`${styles.EditRequestModal__section}`}>
                        <div className={`${styles.EditRequestModal__prescriptions}`}>
                            <PrescriptionItemsList
                                items={editData.items}
                                handleRemoveItem={() => { }}
                                t={t}
                                readOnly={true}
                            />
                        </div>
                    </div>
                )}

                <FormGroup
                    label={(
                        <>
                            <Icon name="description" size="1rem" />
                            {request.type === 'prescription' ? t('medications') : t('request_note')}
                        </>
                    )}
                    htmlFor="edit-request-note"
                >
                    <Input
                        type="textarea"
                        id="edit-request-note"
                        rows={3}
                        readOnly={isReadOnly}
                        value={editData.request_note || ''}
                        onChange={e => onEditDataChange('request_note', e.target.value)}
                        placeholder={t('no_description')}
                    />
                </FormGroup>

                <FormGroup
                    label={(
                        <>
                            <Icon name="medical_services" size="1rem" />
                            {t('doctor_says')}
                        </>
                    )}
                    htmlFor="edit-request-doctor-note"
                >
                    <Input
                        type="textarea"
                        id="edit-request-doctor-note"
                        rows={3}
                        readOnly={isReadOnly}
                        value={editData.doctor_note || ''}
                        onChange={e => onEditDataChange('doctor_note', e.target.value)}
                        placeholder={t('instructions_notes')}
                    />
                </FormGroup>

                {!isReadOnly && (
                    <div className={`${styles.EditRequestModal__paymentStatus}`}>
                        <span className={`${styles.EditRequestModal__groupLabel}`}>
                            <Icon name="payments" size="1rem" />
                            {t('appointment_payment')}
                        </span>
                        <Checkbox
                            id="edit-request-payment-bonified"
                            checked={editData.payment_status === 'bonified'}
                            onChange={e => onEditDataChange('payment_status', e.target.checked ? 'bonified' : 'debt')}
                            label={t('bonified')}
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};

