
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
                    <Icon name={isReadOnly ? "visibility" : "edit_note"} size="1.5rem" color="var(--accent-color)" />
                    {isReadOnly ? t('request_detail') || 'Detalle de Solicitud' : t('edit_request')}
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
                {isReadOnly ? (
                    /* Read-Only Structured Breakdown */
                    <>
                        <div className={styles.EditRequestModal__metaGrid}>
                            <div className={styles.EditRequestModal__metaItem}>
                                <span className={styles.EditRequestModal__metaLabel}>{t('patient')}</span>
                                <span className={styles.EditRequestModal__metaValue}>{request.patient_name || '-'}</span>
                            </div>
                            <div className={styles.EditRequestModal__metaItem}>
                                <span className={styles.EditRequestModal__metaLabel}>{t('doctor')}</span>
                                <span className={styles.EditRequestModal__metaValue}>
                                    {request.doctor_name ? `Dr. ${request.doctor_name}` : '-'}
                                </span>
                            </div>
                            <div className={styles.EditRequestModal__metaItem}>
                                <span className={styles.EditRequestModal__metaLabel}>{t('type')}</span>
                                <span className={styles.EditRequestModal__metaValue}>
                                    {t(request.type) || request.type}
                                </span>
                            </div>
                            <div className={styles.EditRequestModal__metaItem}>
                                <span className={styles.EditRequestModal__metaLabel}>{t('status')}</span>
                                <span className={styles.EditRequestModal__metaValue}>
                                    <span className={`badge ${request.status === 'completed' ? 'badge--success' : (request.status === 'rejected' ? 'badge--danger' : 'badge--warning')}`}>
                                        {t(request.status) || request.status}
                                    </span>
                                </span>
                            </div>
                        </div>

                        {request.type === 'prescription' && editData.items && editData.items.length > 0 && (
                            <div className={`${styles.EditRequestModal__section}`}>
                                <span className={styles.EditRequestModal__groupLabel}>
                                    <Icon name="medication" size="1.1rem" />
                                    {t('medications')}
                                </span>
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

                        <div className={styles.EditRequestModal__detailCard}>
                            <div className={styles.EditRequestModal__detailHeader}>
                                <span className={styles.EditRequestModal__groupLabel}>
                                    <Icon name="description" size="1rem" />
                                    {request.type === 'prescription' ? t('medications') : t('request_note')}
                                </span>
                            </div>
                            {editData.request_note ? (
                                <p className={styles.EditRequestModal__detailContent}>{editData.request_note}</p>
                            ) : (
                                <p className={styles.EditRequestModal__emptyText}>{t('no_description')}</p>
                            )}
                        </div>

                        <div className={styles.EditRequestModal__detailCard}>
                            <div className={styles.EditRequestModal__detailHeader}>
                                <span className={styles.EditRequestModal__groupLabel}>
                                    <Icon name="medical_services" size="1rem" />
                                    {t('doctor_says')}
                                </span>
                            </div>
                            {editData.doctor_note ? (
                                <p className={styles.EditRequestModal__detailContent}>{editData.doctor_note}</p>
                            ) : (
                                <p className={styles.EditRequestModal__emptyText}>{t('no_doctor_reply') || 'Sin respuesta del profesional aún'}</p>
                            )}
                        </div>

                        <div className={`${styles.EditRequestModal__paymentStatus}`}>
                            <span className={`${styles.EditRequestModal__groupLabel}`}>
                                <Icon name="payments" size="1rem" />
                                {t('payment_status') || 'Estado de Pago'}
                            </span>
                            <div>
                                <span className={`badge ${request.payment_status === 'paid' ? 'badge--success' : (request.payment_status === 'bonified' ? 'badge--info' : 'badge--warning')}`}>
                                    {request.payment_status === 'paid' ? t('paid') :
                                        (request.payment_status === 'bonified' ? t('bonified') :
                                            ((request.payment_status === 'debt' || request.payment_status === 'partial') ? `${t(request.payment_status)} ${request.debt_amount ? `$${request.debt_amount}` : ''}` : t('pending')))}
                                </span>
                                {request.payment_method && (
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        ({t(request.payment_method) || request.payment_method})
                                    </span>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Edit Form Mode */
                    <>
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
                                value={editData.doctor_note || ''}
                                onChange={e => onEditDataChange('doctor_note', e.target.value)}
                                placeholder={t('instructions_notes')}
                            />
                        </FormGroup>
                    </>
                )}
            </div>
        </Modal>
    );
};

