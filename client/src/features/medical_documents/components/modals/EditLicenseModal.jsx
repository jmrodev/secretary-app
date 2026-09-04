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
                {editData._readOnly ? (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--dashboard-card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('request_note')}
                            </span>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                {editData.request_note || t('no_description')}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--dashboard-card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('doctor_note')}
                            </span>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                {editData.doctor_note || (t('no_doctor_reply') || 'Sin respuesta del profesional aún')}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <FormGroup label={t('request_note')} htmlFor="edit-license-request-note">
                            <Input
                                type="textarea"
                                id="edit-license-request-note"
                                rows={4}
                                value={editData.request_note || ''}
                                onChange={e => onEditDataChange('request_note', e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup label={t('doctor_note')} htmlFor="edit-license-doctor-note">
                            <Input
                                type="textarea"
                                id="edit-license-doctor-note"
                                rows={3}
                                value={editData.doctor_note || ''}
                                onChange={e => onEditDataChange('doctor_note', e.target.value)}
                            />
                        </FormGroup>
                    </>
                )}
            </div>
        </Modal>
    );
};

